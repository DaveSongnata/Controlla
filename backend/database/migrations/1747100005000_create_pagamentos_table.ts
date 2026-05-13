import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pagamentos'

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
        .onDelete('RESTRICT')
      table
        .uuid('divida_id')
        .nullable()
        .references('id')
        .inTable('dividas')
        .onDelete('RESTRICT')
      table.bigInteger('valor_centavos').notNullable()
      table.text('observacao').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE INDEX pagamentos_tenant_cliente_created_idx ON pagamentos (tenant_id, cliente_id, created_at DESC)'
    )
    this.schema.raw('CREATE INDEX pagamentos_tenant_created_idx ON pagamentos (tenant_id, created_at DESC)')
    this.schema.raw(
      'ALTER TABLE pagamentos ADD CONSTRAINT pagamentos_valor_positivo CHECK (valor_centavos > 0)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
