import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('dividas', (t) => {
      t.uuid('idempotency_key').nullable()
    })
    this.schema.alterTable('pagamentos', (t) => {
      t.uuid('idempotency_key').nullable()
    })

    // Unicidade por tenant. Parcial: só linhas com key.
    this.schema.raw(`
      CREATE UNIQUE INDEX dividas_idempotency_per_tenant_idx
      ON dividas (tenant_id, idempotency_key)
      WHERE idempotency_key IS NOT NULL
    `)
    this.schema.raw(`
      CREATE UNIQUE INDEX pagamentos_idempotency_per_tenant_idx
      ON pagamentos (tenant_id, idempotency_key)
      WHERE idempotency_key IS NOT NULL
    `)
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS dividas_idempotency_per_tenant_idx')
    this.schema.raw('DROP INDEX IF EXISTS pagamentos_idempotency_per_tenant_idx')
    this.schema.alterTable('dividas', (t) => t.dropColumn('idempotency_key'))
    this.schema.alterTable('pagamentos', (t) => t.dropColumn('idempotency_key'))
  }
}
