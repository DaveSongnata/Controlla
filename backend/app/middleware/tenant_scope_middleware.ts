import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Tenant from '#models/tenant'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    tenant: Tenant
  }
}

/**
 * Lê o tenant a partir do usuário autenticado e fixa em ctx.tenant.
 * Frontend nunca informa tenant_id. Toda query de domínio DEVE usar ctx.tenant.id.
 */
export default class TenantScopeMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user || !user.tenantId) {
      return ctx.response.unauthorized({ error: 'Sessão sem tenant ativo.' })
    }

    const tenant = await Tenant.find(user.tenantId)
    if (!tenant) {
      await ctx.auth.use('web').logout()
      return ctx.response.redirect('/login')
    }

    if (tenant.status !== 'active') {
      await ctx.auth.use('web').logout()
      ctx.session.flash('error', `Sua loja está ${tenant.status === 'suspended' ? 'suspensa' : 'bloqueada'}.`)
      return ctx.response.redirect('/login')
    }

    ctx.tenant = tenant
    return next()
  }
}
