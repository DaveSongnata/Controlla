import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'magic_links'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('tenant_id')
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
      table
        .uuid('cliente_id')
        .notNullable()
        .references('id')
        .inTable('clientes')
        .onDelete('CASCADE')
      table.string('token', 64).notNullable().unique()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE INDEX magic_links_cliente_idx ON magic_links (cliente_id, created_at DESC)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
