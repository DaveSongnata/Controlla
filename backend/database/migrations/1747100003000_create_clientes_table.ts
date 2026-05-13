import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clientes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('tenant_id')
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
      table.string('nome', 120).notNullable()
      table.string('whatsapp', 20).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw('CREATE INDEX clientes_tenant_nome_idx ON clientes (tenant_id, nome)')
    this.schema.raw(
      'CREATE INDEX clientes_tenant_whatsapp_idx ON clientes (tenant_id, whatsapp)'
    )
    this.schema.raw(
      'CREATE INDEX clientes_nome_trgm_idx ON clientes USING gin (nome gin_trgm_ops)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
