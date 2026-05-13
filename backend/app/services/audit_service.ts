import db from '@adonisjs/lucid/services/db'
import { HttpContext } from '@adonisjs/core/http'

export type AuditAction =
  | 'CREATE_DIVIDA'
  | 'UPDATE_DIVIDA'
  | 'DELETE_DIVIDA'
  | 'CREATE_PAGAMENTO'
  | 'UPDATE_PAGAMENTO'
  | 'DELETE_PAGAMENTO'
  | 'CREATE_CLIENTE'
  | 'UPDATE_CLIENTE'
  | 'UPDATE_TENANT'
  | 'UPDATE_TENANT_STATUS'

type AuditInput = {
  action: AuditAction
  entityTable: string
  entityId: string
  oldPayload?: unknown
  newPayload?: unknown
}

/**
 * Grava uma linha em audit_logs com tenant/user/request_id pegos do
 * HttpContext via AsyncLocalStorage. Fire-and-forget: nenhuma falha
 * de auditoria pode bloquear a operação financeira do lojista.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  let tenantId: string | null = null
  let userId: string | null = null
  let requestId: string | null = null
  let ip: string | null = null

  try {
    const ctx = HttpContext.get()
    if (ctx) {
      tenantId = (ctx as any).tenant?.id ?? null
      userId = ctx.auth?.user?.id ?? null
      requestId = ctx.request.id() ?? null
      ip = ctx.request.ip() ?? null
    }
  } catch {
    /* fora de HTTP (seeder, repl, etc.) — segue sem contexto */
  }

  try {
    await db.table('audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      action: input.action,
      entity_table: input.entityTable,
      entity_id: input.entityId,
      old_payload: input.oldPayload == null ? null : JSON.stringify(input.oldPayload),
      new_payload: input.newPayload == null ? null : JSON.stringify(input.newPayload),
      request_id: requestId,
      ip,
    })
  } catch {
    /* auditoria nunca derruba o request principal */
  }
}
