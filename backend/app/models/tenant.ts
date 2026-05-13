import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import User from '#models/user'

export type TenantStatus = 'active' | 'suspended' | 'blocked'

export default class Tenant extends BaseModel {
  static table = 'tenants'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nome: string

  @column({ columnName: 'pix_key' })
  declare pixKey: string | null

  @column()
  declare status: TenantStatus

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => User)
  declare users: HasMany<typeof User>

  @beforeCreate()
  static assignUuid(tenant: Tenant) {
    if (!tenant.id) tenant.id = randomUUID()
  }
}
