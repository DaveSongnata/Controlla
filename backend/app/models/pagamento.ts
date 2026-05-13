import { DateTime } from 'luxon'
import { BaseModel, afterCreate, afterDelete, beforeCreate, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import { recordAudit } from '#services/audit_service'

export default class Pagamento extends BaseModel {
  static table = 'pagamentos'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'tenant_id' })
  declare tenantId: string

  @column({ columnName: 'cliente_id' })
  declare clienteId: string

  @column({ columnName: 'divida_id' })
  declare dividaId: string | null

  @column({ columnName: 'valor_centavos' })
  declare valorCentavos: number

  @column()
  declare observacao: string | null

  @column({ columnName: 'idempotency_key' })
  declare idempotencyKey: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @beforeCreate()
  static assignUuid(p: Pagamento) {
    if (!p.id) p.id = randomUUID()
  }

  @afterCreate()
  static async auditCreate(p: Pagamento) {
    await recordAudit({
      action: 'CREATE_PAGAMENTO',
      entityTable: 'pagamentos',
      entityId: p.id,
      newPayload: p.serialize(),
    })
  }

  @afterDelete()
  static async auditDelete(p: Pagamento) {
    await recordAudit({
      action: 'DELETE_PAGAMENTO',
      entityTable: 'pagamentos',
      entityId: p.id,
      oldPayload: p.serialize(),
    })
  }
}
