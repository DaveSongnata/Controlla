import { DateTime } from 'luxon'
import {
  BaseModel,
  afterCreate,
  afterDelete,
  afterUpdate,
  beforeCreate,
  beforeUpdate,
  column,
} from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import { recordAudit } from '#services/audit_service'

export type DividaStatus = 'aberta' | 'parcial' | 'paga'

export default class Divida extends BaseModel {
  static table = 'dividas'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'tenant_id' })
  declare tenantId: string

  @column({ columnName: 'cliente_id' })
  declare clienteId: string

  @column({ columnName: 'valor_centavos' })
  declare valorCentavos: number

  @column({ columnName: 'saldo_centavos' })
  declare saldoCentavos: number

  @column({
    columnName: 'descricao_tags',
    prepare: (value: string[]) => JSON.stringify(value ?? []),
    consume: (value: unknown) => {
      if (Array.isArray(value)) return value as string[]
      if (typeof value === 'string') {
        try {
          const v = JSON.parse(value)
          return Array.isArray(v) ? (v as string[]) : []
        } catch {
          return []
        }
      }
      return []
    },
  })
  declare descricaoTags: string[]

  @column({ columnName: 'descricao_raw' })
  declare descricaoRaw: string | null

  @column({ columnName: 'status_pagamento' })
  declare statusPagamento: DividaStatus

  @column({ columnName: 'idempotency_key' })
  declare idempotencyKey: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Snapshot mantido durante o ciclo update — usado pelo audit log.
  private _previousSnapshot: Record<string, unknown> | null = null

  @beforeCreate()
  static assignUuid(d: Divida) {
    if (!d.id) d.id = randomUUID()
    if (d.saldoCentavos === undefined || d.saldoCentavos === null) {
      d.saldoCentavos = d.valorCentavos
    }
  }

  @afterCreate()
  static async auditCreate(d: Divida) {
    await recordAudit({
      action: 'CREATE_DIVIDA',
      entityTable: 'dividas',
      entityId: d.id,
      newPayload: d.serialize(),
    })
  }

  @beforeUpdate()
  static captureBefore(d: Divida) {
    d._previousSnapshot = { ...d.$original }
  }

  @afterUpdate()
  static async auditUpdate(d: Divida) {
    await recordAudit({
      action: 'UPDATE_DIVIDA',
      entityTable: 'dividas',
      entityId: d.id,
      oldPayload: d._previousSnapshot,
      newPayload: d.serialize(),
    })
    d._previousSnapshot = null
  }

  @afterDelete()
  static async auditDelete(d: Divida) {
    await recordAudit({
      action: 'DELETE_DIVIDA',
      entityTable: 'dividas',
      entityId: d.id,
      oldPayload: d.serialize(),
    })
  }
}
