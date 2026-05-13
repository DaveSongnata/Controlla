import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Cliente from '#models/cliente'
import { clienteStoreValidator } from '#validators/cliente'
import { generateMagicLinkForCliente } from '#services/magic_link_service'

export default class ClientesController {
  async index({ inertia, request, tenant }: HttpContext) {
    const search = (request.input('q') ?? '').toString().trim()

    // Subqueries correlatas evitam o cross-join (dividas × pagamentos)
    // que distorceria MAX/MIN e o SUM do saldo.
    const query = db
      .from('clientes as c')
      .where('c.tenant_id', tenant.id)
      .select(
        'c.id',
        'c.nome',
        'c.whatsapp',
        'c.created_at',
        db.raw(`
          COALESCE((
            SELECT SUM(saldo_centavos)::bigint
            FROM dividas d
            WHERE d.tenant_id = c.tenant_id
              AND d.cliente_id = c.id
              AND d.status_pagamento <> 'paga'
          ), 0) as saldo_centavos
        `),
        db.raw(`
          CASE
            -- Sem saldo aberto: não há risco a sinalizar.
            WHEN COALESCE((
              SELECT SUM(saldo_centavos)
              FROM dividas d
              WHERE d.tenant_id = c.tenant_id
                AND d.cliente_id = c.id
                AND d.status_pagamento <> 'paga'
            ), 0) = 0 THEN false
            -- Caloteiro originário: nunca pagou — usa a 1ª dívida em aberto como ancora.
            -- Cliente ativo: usa o último pagamento.
            WHEN (
              CURRENT_DATE - COALESCE(
                (SELECT MAX(p.created_at)::date
                   FROM pagamentos p
                  WHERE p.tenant_id = c.tenant_id AND p.cliente_id = c.id),
                (SELECT MIN(d.created_at)::date
                   FROM dividas d
                  WHERE d.tenant_id = c.tenant_id
                    AND d.cliente_id = c.id
                    AND d.status_pagamento <> 'paga')
              )
            ) > 30 THEN true
            ELSE false
          END as alto_risco
        `)
      )
      .orderBy('c.nome', 'asc')

    if (search.length) {
      query.whereRaw('lower(immutable_unaccent(c.nome)) LIKE lower(immutable_unaccent(?))', [`%${search}%`])
    }

    const rows = await query

    return inertia.render('lojista/clientes/index', {
      search,
      clientes: rows.map((r: any) => ({
        id: r.id,
        nome: r.nome,
        whatsapp: r.whatsapp,
        saldoCentavos: Number(r.saldo_centavos ?? 0),
        altoRisco: !!r.alto_risco,
      })),
    })
  }

  async store(ctx: HttpContext) {
    const { request, response, session, tenant } = ctx
    const data = await request.validateUsing(clienteStoreValidator)
    const cliente = await Cliente.create({
      tenantId: tenant.id,
      nome: data.nome,
      whatsapp: data.whatsapp ?? null,
    })
    session.flash('success', `Cliente "${cliente.nome}" cadastrado.`)
    return response.redirect().toRoute('lojista.clientes.show', { id: cliente.id })
  }

  async show({ inertia, params, request, tenant, response }: HttpContext) {
    const cliente = await Cliente.query()
      .where('tenant_id', tenant.id)
      .andWhere('id', params.id)
      .first()
    if (!cliente) return response.notFound()

    // Paginação do extrato (50/página). Contagem total via mesma UNION para
    // o paginador saber quando parar.
    const perPage = 50
    const page = Math.max(1, Number.parseInt(request.input('page') ?? '1', 10) || 1)

    const totalRow = await db.rawQuery(
      `
      SELECT
        (SELECT COUNT(*) FROM dividas WHERE tenant_id = ? AND cliente_id = ?)
        +
        (SELECT COUNT(*) FROM pagamentos WHERE tenant_id = ? AND cliente_id = ?)
        AS total
      `,
      [tenant.id, cliente.id, tenant.id, cliente.id]
    )
    const totalEntries = Number(totalRow.rows?.[0]?.total ?? 0)
    const lastPage = Math.max(1, Math.ceil(totalEntries / perPage))
    const safePage = Math.min(page, lastPage)
    const offset = (safePage - 1) * perPage

    const extrato = await db.rawQuery(
      `
      SELECT 'divida' as tipo, d.id, d.created_at, d.valor_centavos, d.saldo_centavos,
             d.status_pagamento, d.descricao_tags, d.descricao_raw, NULL::uuid as divida_id, NULL::text as observacao
      FROM dividas d
      WHERE d.tenant_id = ? AND d.cliente_id = ?
      UNION ALL
      SELECT 'pagamento' as tipo, p.id, p.created_at, p.valor_centavos, 0::bigint as saldo_centavos,
             NULL as status_pagamento, '[]'::jsonb as descricao_tags, NULL as descricao_raw, p.divida_id, p.observacao
      FROM pagamentos p
      WHERE p.tenant_id = ? AND p.cliente_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [tenant.id, cliente.id, tenant.id, cliente.id, perPage, offset]
    )

    const saldoRow = await db
      .from('dividas')
      .where('tenant_id', tenant.id)
      .andWhere('cliente_id', cliente.id)
      .whereIn('status_pagamento', ['aberta', 'parcial'])
      .sum('saldo_centavos as total')
      .first()

    // Score de calote — mesma regra do índice (Caloteiro Originário coberto).
    const riskRow = await db.rawQuery(
      `
      SELECT
        COALESCE((
          SELECT SUM(saldo_centavos) FROM dividas
          WHERE tenant_id = ? AND cliente_id = ? AND status_pagamento <> 'paga'
        ), 0) AS saldo_aberto,
        CURRENT_DATE - COALESCE(
          (SELECT MAX(created_at)::date FROM pagamentos WHERE tenant_id = ? AND cliente_id = ?),
          (SELECT MIN(created_at)::date FROM dividas
             WHERE tenant_id = ? AND cliente_id = ? AND status_pagamento <> 'paga')
        ) AS dias_sem_movimento
      `,
      [tenant.id, cliente.id, tenant.id, cliente.id, tenant.id, cliente.id]
    )
    const r0 = riskRow.rows?.[0] ?? {}
    const saldoAberto = Number(r0.saldo_aberto ?? 0)
    const dias = r0.dias_sem_movimento === null ? null : Number(r0.dias_sem_movimento)
    const altoRisco = saldoAberto > 0 && dias !== null && dias > 30

    return inertia.render('lojista/clientes/show', {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        whatsapp: cliente.whatsapp,
        altoRisco,
        diasSemMovimento: dias,
      },
      saldoCentavos: Number(saldoRow?.total ?? 0),
      extrato: extrato.rows.map((r: any) => ({
        tipo: r.tipo,
        id: r.id,
        createdAt: r.created_at,
        valorCentavos: Number(r.valor_centavos),
        saldoCentavos: Number(r.saldo_centavos ?? 0),
        statusPagamento: r.status_pagamento,
        descricaoTags: Array.isArray(r.descricao_tags) ? r.descricao_tags : [],
        descricaoRaw: r.descricao_raw,
        dividaId: r.divida_id,
        observacao: r.observacao,
      })),
      pagination: {
        page: safePage,
        perPage,
        total: totalEntries,
        lastPage,
      },
    })
  }

  async magicLink({ params, response, session, tenant }: HttpContext) {
    const cliente = await Cliente.query()
      .where('tenant_id', tenant.id)
      .andWhere('id', params.id)
      .first()
    if (!cliente) return response.notFound()

    const url = await generateMagicLinkForCliente(cliente)
    session.flash('success', `Link gerado: ${url}`)
    return response.redirect().toRoute('lojista.clientes.show', { id: cliente.id })
  }

  /**
   * Gera o magic-link e devolve o pacote pronto para abrir o WhatsApp Web.
   * Frontend chama via fetch e faz window.open(whatsappUrl).
   */
  async enviarCobranca({ params, response, tenant }: HttpContext) {
    const cliente = await Cliente.query()
      .where('tenant_id', tenant.id)
      .andWhere('id', params.id)
      .first()
    if (!cliente) return response.notFound()

    const saldoRow = await db
      .from('dividas')
      .where('tenant_id', tenant.id)
      .andWhere('cliente_id', cliente.id)
      .whereIn('status_pagamento', ['aberta', 'parcial'])
      .sum('saldo_centavos as total')
      .first()
    const saldoCentavos = Number(saldoRow?.total ?? 0)
    const saldoBRL = (saldoCentavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

    const magicUrl = await generateMagicLinkForCliente(cliente)

    const message =
      `Olá, ${cliente.nome}! Aqui é a ${tenant.nome}.\n` +
      `Seu saldo atualizado é ${saldoBRL}.\n` +
      `Resumo e chave PIX: ${magicUrl}`

    const onlyDigits = (cliente.whatsapp ?? '').replace(/\D+/g, '')
    const whatsappUrl = onlyDigits
      ? `https://wa.me/${onlyDigits}?text=${encodeURIComponent(message)}`
      : null

    return response.json({
      magicUrl,
      whatsappUrl,
      message,
      hasWhatsapp: !!onlyDigits,
    })
  }
}
