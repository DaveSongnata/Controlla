import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { topDevedores } from '#services/maiores_devedores_service'

export default class DashboardController {
  async index({ inertia, tenant }: HttpContext) {
    // Total na rua = soma dos saldos abertos
    const totalRow = await db
      .from('dividas')
      .where('tenant_id', tenant.id)
      .whereIn('status_pagamento', ['aberta', 'parcial'])
      .sum('saldo_centavos as total')
      .first()

    // Recebido no mês — corrente
    const recebidoMesRow = await db
      .from('pagamentos')
      .where('tenant_id', tenant.id)
      .whereRaw("created_at >= date_trunc('month', now())")
      .sum('valor_centavos as total')
      .first()

    // Total de clientes
    const clientesCountRow = await db
      .from('clientes')
      .where('tenant_id', tenant.id)
      .count('id as count')
      .first()

    const devedores = await topDevedores(tenant.id, 10)

    // Produtos mais vendidos no mês corrente (tags agregadas via JSONB)
    const produtosRow = await db.rawQuery(
      `
      SELECT tag, COUNT(*)::int AS qty
      FROM dividas, jsonb_array_elements_text(descricao_tags) tag
      WHERE tenant_id = ?
        AND created_at >= date_trunc('month', now())
      GROUP BY tag
      ORDER BY qty DESC, tag ASC
      LIMIT 8
      `,
      [tenant.id]
    )

    return inertia.render('lojista/dashboard', {
      totalNaRuaCentavos: Number(totalRow?.total ?? 0),
      recebidoMesCentavos: Number(recebidoMesRow?.total ?? 0),
      clientesCount: Number(clientesCountRow?.count ?? 0),
      devedores: devedores.map((d) => ({
        clienteId: d.cliente_id,
        nome: d.cliente_nome,
        whatsapp: d.cliente_whatsapp,
        saldoCentavos: Number(d.saldo_centavos),
      })),
      produtosMes: produtosRow.rows.map((r: any) => ({
        tag: r.tag,
        qty: Number(r.qty),
      })),
    })
  }
}
