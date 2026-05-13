import { BaseSeeder } from '@adonisjs/lucid/seeders'
import app from '@adonisjs/core/services/app'
import Tenant from '#models/tenant'
import User from '#models/user'
import Cliente from '#models/cliente'

/** Demo data — só roda em dev. */
export default class DemoTenantSeeder extends BaseSeeder {
  static environment = ['development']

  async run() {
    if (!app.inDev) return

    const existing = await Tenant.findBy('nome', 'Mercadinho Akita')
    if (existing) return

    const tenant = await Tenant.create({
      nome: 'Mercadinho Akita',
      pixKey: '11999990000',
      status: 'active',
    })

    await User.create({
      tenantId: tenant.id,
      nome: 'Lojista Demo',
      email: 'lojista@controlla.local',
      password: 'lojista12345',
      role: 'lojista',
    })

    await Cliente.createMany([
      { tenantId: tenant.id, nome: 'Marcelo Lima', whatsapp: '5511988887777' },
      { tenantId: tenant.id, nome: 'Antônia Souza', whatsapp: '5511977776666' },
      { tenantId: tenant.id, nome: 'Carlos Andrade', whatsapp: null },
    ])
  }
}
