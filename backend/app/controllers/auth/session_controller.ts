import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Tenant from '#models/tenant'
import { loginValidator } from '#validators/auth'
import { loginThrottle } from '#start/limiter'

export default class SessionController {
  async show({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  async store(ctx: HttpContext) {
    const { request, response, auth, session } = ctx
    const { email, password } = await request.validateUsing(loginValidator)

    const key = `login_${request.ip()}_${email}`
    const [error, user] = await loginThrottle.penalize(key, async () => {
      return User.verifyCredentials(email, password)
    })

    if (error) {
      session.flashAll()
      session.flash('error', `Muitas tentativas. Tente novamente em ${error.response.availableIn}s.`)
      return response.redirect().back()
    }

    if (user.role === 'lojista') {
      const tenant = user.tenantId ? await Tenant.find(user.tenantId) : null
      if (!tenant || tenant.status !== 'active') {
        session.flashAll()
        session.flash('error', tenant ? `Loja ${tenant.status === 'suspended' ? 'suspensa' : 'bloqueada'}.` : 'Loja não encontrada.')
        return response.redirect().back()
      }
    }

    await auth.use('web').login(user)
    return response.redirect(user.role === 'super_admin' ? '/admin' : '/painel')
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/login')
  }
}
