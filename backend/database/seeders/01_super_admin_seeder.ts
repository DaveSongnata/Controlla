import { BaseSeeder } from '@adonisjs/lucid/seeders'
import env from '#start/env'
import User from '#models/user'

export default class SuperAdminSeeder extends BaseSeeder {
  async run() {
    const email = env.get('SUPER_ADMIN_EMAIL')
    const password = env.get('SUPER_ADMIN_PASSWORD')

    const existing = await User.findBy('email', email)
    if (existing) {
      console.info(`Super admin "${email}" já existe.`)
      return
    }

    await User.create({
      tenantId: null,
      nome: 'Super Admin',
      email,
      password,
      role: 'super_admin',
    })

    console.info(`Super admin "${email}" criado.`)
  }
}
