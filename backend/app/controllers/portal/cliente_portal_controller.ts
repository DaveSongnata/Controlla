import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import MagicLink from '#models/magic_link'
import Cliente from '#models/cliente'
import Tenant from '#models/tenant'

export default class ClientePortalController {
  async show({ params, response, inertia }: HttpContext) {
    const link = await MagicLink.findBy('token', params.token)
    if (!link || link.isExpired()) return response.notFound()

    const tenant = await Tenant.find(link.tenantId)
    if (!tenant || tenant.status !== 'active') return response.notFound()

    const cliente = await Cliente.find(link.clienteId)
    if (!cliente) return response.notFound()

    const saldoRow = await db
      .from('dividas')
      .where('tenant_id', tenant.id)
      .andWhere('cliente_id', cliente.id)
      .whereIn('status_pagamento', ['aberta', 'parcial'])
      .sum('saldo_centavos as total')
      .first()

    const extrato = await db.rawQuery(
      `
      SELECT 'divida' as tipo, d.id, d.created_at, d.valor_centavos, d.saldo_centavos,
             d.descricao_tags, d.descricao_raw
      FROM dividas d
      WHERE d.tenant_id = ? AND d.cliente_id = ?
      UNION ALL
      SELECT 'pagamento' as tipo, p.id, p.created_at, p.valor_centavos, 0::bigint as saldo_centavos,
             '[]'::jsonb as descricao_tags, p.observacao as descricao_raw
      FROM pagamentos p
      WHERE p.tenant_id = ? AND p.cliente_id = ?
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [tenant.id, cliente.id, tenant.id, cliente.id]
    )

    return inertia.render('portal/cliente', {
      lojaNome: tenant.nome,
      pixKey: tenant.pixKey,
      cliente: { nome: cliente.nome },
      saldoCentavos: Number(saldoRow?.total ?? 0),
      extrato: extrato.rows.map((r: any) => ({
        tipo: r.tipo,
        id: r.id,
        createdAt: r.created_at,
        valorCentavos: Number(r.valor_centavos),
        descricaoTags: Array.isArray(r.descricao_tags) ? r.descricao_tags : [],
        descricaoRaw: r.descricao_raw,
      })),
    })
  }
}
