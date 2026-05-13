import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AuditLog extends BaseModel {
  static table = 'audit_logs'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'tenant_id' })
  declare tenantId: string | null

  @column({ columnName: 'user_id' })
  declare userId: string | null

  @column()
  declare action: string

  @column({ columnName: 'entity_table' })
  declare entityTable: string

  @column({ columnName: 'entity_id' })
  declare entityId: string

  @column({
    columnName: 'old_payload',
    prepare: (v: unknown) => (v == null ? null : JSON.stringify(v)),
  })
  declare oldPayload: unknown | null

  @column({
    columnName: 'new_payload',
    prepare: (v: unknown) => (v == null ? null : JSON.stringify(v)),
  })
  declare newPayload: unknown | null

  @column({ columnName: 'request_id' })
  declare requestId: string | null

  @column()
  declare ip: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
