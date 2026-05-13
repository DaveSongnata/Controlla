import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'

export default class Cliente extends BaseModel {
  static table = 'clientes'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'tenant_id' })
  declare tenantId: string

  @column()
  declare nome: string

  @column()
  declare whatsapp: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  static assignUuid(c: Cliente) {
    if (!c.id) c.id = randomUUID()
  }
}
