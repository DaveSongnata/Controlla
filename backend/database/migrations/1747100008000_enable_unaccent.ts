import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS "unaccent"')
    // Wrapper IMMUTABLE para permitir índice funcional sem acento.
    this.schema.raw(`
      CREATE OR REPLACE FUNCTION immutable_unaccent(text)
      RETURNS text
      LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
      AS $$ SELECT unaccent('unaccent'::regdictionary, $1) $$
    `)
    this.schema.raw(
      'CREATE INDEX IF NOT EXISTS clientes_nome_unaccent_trgm_idx ON clientes USING gin (lower(immutable_unaccent(nome)) gin_trgm_ops)'
    )
  }

  async down() {
    this.schema.raw('DROP INDEX IF EXISTS clientes_nome_unaccent_trgm_idx')
    this.schema.raw('DROP FUNCTION IF EXISTS immutable_unaccent(text)')
  }
}
