import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tenants'

  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')

    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('nome', 120).notNullable()
      table.string('pix_key', 200).nullable()
      table.enum('status', ['active', 'suspended', 'blocked'], {
        useNative: true,
        existingType: false,
        enumName: 'tenant_status',
      }).notNullable().defaultTo('active')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw('CREATE INDEX tenants_status_idx ON tenants (status)')
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS tenant_status')
  }
}
