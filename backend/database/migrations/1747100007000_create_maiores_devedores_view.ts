import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      CREATE MATERIALIZED VIEW maiores_devedores_mv AS
      SELECT
        c.tenant_id,
        c.id              AS cliente_id,
        c.nome            AS cliente_nome,
        c.whatsapp        AS cliente_whatsapp,
        COALESCE(SUM(d.saldo_centavos), 0)::bigint AS saldo_centavos
      FROM clientes c
      LEFT JOIN dividas d
        ON d.cliente_id = c.id
       AND d.status_pagamento <> 'paga'
      GROUP BY c.tenant_id, c.id, c.nome, c.whatsapp
    `)

    this.schema.raw(
      'CREATE UNIQUE INDEX maiores_devedores_mv_pk ON maiores_devedores_mv (tenant_id, cliente_id)'
    )
    this.schema.raw(
      'CREATE INDEX maiores_devedores_mv_saldo_idx ON maiores_devedores_mv (tenant_id, saldo_centavos DESC)'
    )
  }

  async down() {
    this.schema.raw('DROP MATERIALIZED VIEW IF EXISTS maiores_devedores_mv')
  }
}
