import db from '@adonisjs/lucid/services/db'

/** Refresh barato — usa CONCURRENTLY pois temos índice único na MV. */
export async function refreshMaioresDevedores() {
  await db.rawQuery('REFRESH MATERIALIZED VIEW CONCURRENTLY maiores_devedores_mv')
}

export type Devedor = {
  cliente_id: string
  cliente_nome: string
  cliente_whatsapp: string | null
  saldo_centavos: string
}

export async function topDevedores(tenantId: string, limit = 10): Promise<Devedor[]> {
  const rows = await db
    .from('maiores_devedores_mv')
    .where('tenant_id', tenantId)
    .where('saldo_centavos', '>', 0)
    .orderBy('saldo_centavos', 'desc')
    .limit(limit)
  return rows as Devedor[]
}
