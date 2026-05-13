import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Anexa identificadores estáveis ao logger por requisição — todos os
 * logs que partirem de `ctx.logger.*` carregam esses campos automaticamente.
 */
export default class LoggerBindingsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth?.user
    const tenant = (ctx as any).tenant

    ctx.logger = ctx.logger.child({
      request_id: ctx.request.id(),
      ip: ctx.request.ip(),
      route: ctx.route?.pattern ?? ctx.request.url(),
      method: ctx.request.method(),
      tenant_id: tenant?.id ?? null,
      user_id: user?.id ?? null,
      user_role: user?.role ?? null,
    })

    return next()
  }
}
