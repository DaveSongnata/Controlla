import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Cliente from '#models/cliente'
import Divida from '#models/divida'
import Pagamento from '#models/pagamento'
import { fiadoStoreValidator, pagamentoStoreValidator } from '#validators/lancamento'
import { sanitizeTags } from '#services/tag_sanitizer'
import { refreshMaioresDevedores } from '#services/maiores_devedores_service'
import { withSerializationRetry } from '#services/db_retry'

const UNIQUE_VIOLATION = '23505'

function isIdempotencyConflict(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as any
  return (
    e.code === UNIQUE_VIOLATION &&
    typeof e.constraint === 'string' &&
    e.constraint.includes('idempotency')
  )
}

export default class LancamentosController {
  async storeFiado(ctx: HttpContext) {
    const { request, response, session, tenant, logger } = ctx
    const data = await request.validateUsing(fiadoStoreValidator)

    const cliente = await Cliente.query()
      .where('tenant_id', tenant.id)
      .andWhere('id', data.clienteId)
      .first()
    if (!cliente) {
      session.flash('error', 'Cliente inválido.')
      return response.redirect().back()
    }

    const tags = sanitizeTags(data.descricaoRaw)

    try {
      await Divida.create({
        tenantId: tenant.id,
        clienteId: cliente.id,
        valorCentavos: data.valorCentavos,
        saldoCentavos: data.valorCentavos,
        descricaoTags: tags,
        descricaoRaw: data.descricaoRaw,
        statusPagamento: 'aberta',
        idempotencyKey: data.idempotencyKey ?? null,
      })
    } catch (err) {
      if (isIdempotencyConflict(err)) {
        logger.info(
          { idempotency_key: data.idempotencyKey, cliente_id: cliente.id },
          'fiado replay ignorado pela chave de idempotência'
        )
        session.flash('success', 'Fiado já registrado.')
        return response.redirect().toRoute('lojista.clientes.show', { id: cliente.id })
      }
      throw err
    }

    await refreshMaioresDevedores().catch(() => undefined)
    session.flash('success', 'Fiado lançado.')
    return response.redirect().toRoute('lojista.clientes.show', { id: cliente.id })
  }

  async storePagamento(ctx: HttpContext) {
    const { request, response, session, tenant, logger } = ctx
    const data = await request.validateUsing(pagamentoStoreValidator)

    const cliente = await Cliente.query()
      .where('tenant_id', tenant.id)
      .andWhere('id', data.clienteId)
      .first()
    if (!cliente) {
      session.flash('error', 'Cliente inválido.')
      return response.redirect().back()
    }

    try {
      await withSerializationRetry(async () => {
        await db.transaction(async (trx) => {
          let restante = data.valorCentavos

          // Se uma dívida específica foi indicada, abate primeiro
          if (data.dividaId) {
            const d = await Divida.query({ client: trx })
              .where('tenant_id', tenant.id)
              .andWhere('cliente_id', cliente.id)
              .andWhere('id', data.dividaId)
              .forUpdate()
              .first()
            if (d) {
              restante = abateDivida(d, restante)
              await d.useTransaction(trx).save()
            }
          }

          // FIFO sobre o restante
          while (restante > 0) {
            const proxima = await Divida.query({ client: trx })
              .where('tenant_id', tenant.id)
              .andWhere('cliente_id', cliente.id)
              .whereIn('status_pagamento', ['aberta', 'parcial'])
              .orderBy('created_at', 'asc')
              .forUpdate()
              .first()
            if (!proxima) break
            restante = abateDivida(proxima, restante)
            await proxima.useTransaction(trx).save()
          }

          const valorAplicado = data.valorCentavos - restante
          if (valorAplicado > 0) {
            await Pagamento.create(
              {
                tenantId: tenant.id,
                clienteId: cliente.id,
                dividaId: data.dividaId ?? null,
                valorCentavos: valorAplicado,
                observacao: data.observacao ?? null,
                idempotencyKey: data.idempotencyKey ?? null,
              },
              { client: trx }
            )
          }

          if (restante > 0) {
            session.flash('warn', 'Valor recebido excedeu a dívida — sobra desconsiderada.')
          }
        })
      })
    } catch (err) {
      if (isIdempotencyConflict(err)) {
        logger.info(
          { idempotency_key: data.idempotencyKey, cliente_id: cliente.id },
          'pagamento replay ignorado pela chave de idempotência'
        )
        session.flash('success', 'Pagamento já registrado.')
        return response.redirect().toRoute('lojista.clientes.show', { id: cliente.id })
      }
      throw err
    }

    await refreshMaioresDevedores().catch(() => undefined)
    session.flash('success', 'Pagamento registrado.')
    return response.redirect().toRoute('lojista.clientes.show', { id: cliente.id })
  }
}

function abateDivida(d: Divida, restante: number): number {
  const abate = Math.min(d.saldoCentavos, restante)
  d.saldoCentavos = d.saldoCentavos - abate
  if (d.saldoCentavos === 0) {
    d.statusPagamento = 'paga'
  } else if (d.saldoCentavos < d.valorCentavos) {
    d.statusPagamento = 'parcial'
  }
  return restante - abate
}
