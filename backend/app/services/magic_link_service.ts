import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import env from '#start/env'
import MagicLink from '#models/magic_link'
import type Cliente from '#models/cliente'

const TTL_DAYS = 30

export async function generateMagicLinkForCliente(cliente: Cliente): Promise<string> {
  const token = randomBytes(24).toString('base64url')
  const link = await MagicLink.create({
    tenantId: cliente.tenantId,
    clienteId: cliente.id,
    token,
    expiresAt: DateTime.utc().plus({ days: TTL_DAYS }),
  })
  return `${env.get('APP_URL').replace(/\/$/, '')}/c/${link.token}`
}
