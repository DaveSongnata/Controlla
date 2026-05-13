import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('tenant_id')
        .nullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
      table.string('nome', 120).notNullable()
      table.string('email', 200).notNullable().unique()
      table.string('password', 200).notNullable()
      table.enum('role', ['super_admin', 'lojista'], {
        useNative: true,
        existingType: false,
        enumName: 'user_role',
      }).notNullable().defaultTo('lojista')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw('CREATE INDEX users_tenant_id_idx ON users (tenant_id)')
    this.schema.raw('CREATE INDEX users_role_idx ON users (role)')
    // Super-admin never has a tenant; lojista must
    this.schema.raw(`
      ALTER TABLE users ADD CONSTRAINT users_tenant_role_check
      CHECK (
        (role = 'super_admin' AND tenant_id IS NULL)
        OR (role = 'lojista' AND tenant_id IS NOT NULL)
      )
    `)
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS user_role')
  }
}
