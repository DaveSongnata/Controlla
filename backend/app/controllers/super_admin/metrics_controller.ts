import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class MetricsController {
  async index({ inertia }: HttpContext) {
    const statusRows = await db
      .from('tenants')
      .select('status')
      .count('* as count')
      .groupBy('status')

    const usersCount = await db.from('users').count('* as count').first()
    const clientesCount = await db.from('clientes').count('* as count').first()
    const dividasAbertas = await db
      .from('dividas')
      .whereIn('status_pagamento', ['aberta', 'parcial'])
      .sum('saldo_centavos as total')
      .first()

    const newTenantsLast30 = await db
      .from('tenants')
      .whereRaw("created_at >= now() - interval '30 days'")
      .count('* as count')
      .first()

    // Volume de requisições — global, últimos 30 dias
    const requestsToday = await db
      .from('request_metrics')
      .whereRaw('day = CURRENT_DATE')
      .first()
    const requestsLast30Row = await db
      .from('request_metrics')
      .whereRaw("day >= CURRENT_DATE - interval '30 days'")
      .sum('count as total')
      .first()
    const requestsSeries = await db
      .from('request_metrics')
      .whereRaw("day >= CURRENT_DATE - interval '14 days'")
      .orderBy('day', 'asc')
      .select('day', 'count')

    return inertia.render('super_admin/dashboard', {
      tenants: {
        byStatus: Object.fromEntries(
          (statusRows as any[]).map((r) => [r.status, Number(r.count)])
        ),
        newLast30: Number(newTenantsLast30?.count ?? 0),
      },
      usersCount: Number(usersCount?.count ?? 0),
      clientesCount: Number(clientesCount?.count ?? 0),
      saldoGlobalCentavos: Number(dividasAbertas?.total ?? 0),
      requests: {
        today: Number(requestsToday?.count ?? 0),
        last30: Number(requestsLast30Row?.total ?? 0),
        series: requestsSeries.map((r: any) => ({
          day: typeof r.day === 'string' ? r.day : r.day.toISOString().slice(0, 10),
          count: Number(r.count),
        })),
      },
    })
  }
}
