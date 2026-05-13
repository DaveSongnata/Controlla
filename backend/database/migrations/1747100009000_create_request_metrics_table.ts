import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'request_metrics'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.date('day').notNullable().primary()
      table.bigInteger('count').notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
