import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'

export default class MagicLink extends BaseModel {
  static table = 'magic_links'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'tenant_id' })
  declare tenantId: string

  @column({ columnName: 'cliente_id' })
  declare clienteId: string

  @column()
  declare token: string

  @column.dateTime({ columnName: 'expires_at' })
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @beforeCreate()
  static assignUuid(m: MagicLink) {
    if (!m.id) m.id = randomUUID()
  }

  isExpired() {
    return this.expiresAt < DateTime.utc()
  }
}
