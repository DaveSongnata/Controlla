import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tag_favorites'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('tenant_id')
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
      table.string('tag', 100).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.primary(['tenant_id', 'tag'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
