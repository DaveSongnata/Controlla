import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.uuid('tenant_id').nullable().references('id').inTable('tenants').onDelete('CASCADE')
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.string('action', 60).notNullable()
      table.string('entity_table', 60).notNullable()
      table.uuid('entity_id').notNullable()
      table.jsonb('old_payload').nullable()
      table.jsonb('new_payload').nullable()
      table.string('request_id', 60).nullable()
      table.string('ip', 60).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
    this.schema.raw(
      'CREATE INDEX audit_logs_tenant_action_created_idx ON audit_logs (tenant_id, action, created_at DESC)'
    )
    this.schema.raw(
      'CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_table, entity_id, created_at DESC)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
