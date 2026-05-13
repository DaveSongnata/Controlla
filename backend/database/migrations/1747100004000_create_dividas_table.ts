import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'dividas'

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
      table.bigInteger('valor_centavos').notNullable()
      table.bigInteger('saldo_centavos').notNullable()
      table.jsonb('descricao_tags').notNullable().defaultTo('[]')
      table.text('descricao_raw').nullable()
      table.enum('status_pagamento', ['aberta', 'parcial', 'paga'], {
        useNative: true,
        existingType: false,
        enumName: 'divida_status',
      }).notNullable().defaultTo('aberta')
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    this.schema.raw(
      'CREATE INDEX dividas_tenant_cliente_status_idx ON dividas (tenant_id, cliente_id, status_pagamento)'
    )
    this.schema.raw(
      'CREATE INDEX dividas_tenant_created_idx ON dividas (tenant_id, created_at DESC)'
    )
    this.schema.raw('CREATE INDEX dividas_tags_gin_idx ON dividas USING gin (descricao_tags)')
    this.schema.raw(
      'ALTER TABLE dividas ADD CONSTRAINT dividas_valor_positivo CHECK (valor_centavos > 0)'
    )
    this.schema.raw(
      'ALTER TABLE dividas ADD CONSTRAINT dividas_saldo_nao_negativo CHECK (saldo_centavos >= 0 AND saldo_centavos <= valor_centavos)'
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS divida_status')
  }
}
