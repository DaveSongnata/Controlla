import type { HttpContext } from '@adonisjs/core/http'
import { configuracoesUpdateValidator } from '#validators/configuracoes'

export default class ConfiguracoesController {
  async edit({ inertia, tenant }: HttpContext) {
    return inertia.render('lojista/configuracoes', {
      tenant: { id: tenant.id, nome: tenant.nome, pixKey: tenant.pixKey },
    })
  }

  async update(ctx: HttpContext) {
    const { request, response, session, tenant } = ctx
    const data = await request.validateUsing(configuracoesUpdateValidator)
    tenant.nome = data.nome
    tenant.pixKey = data.pixKey?.trim() || null
    await tenant.save()
    session.flash('success', 'Configurações atualizadas.')
    return response.redirect().toRoute('lojista.configuracoes.edit')
  }
}
