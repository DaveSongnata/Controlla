import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps } from '@adonisjs/inertia/types'

const inertiaConfig = defineConfig({
  rootView: 'inertia_layout',

  sharedData: {
    errors: (ctx) => ctx.session?.flashMessages.get('errors'),
    flash: (ctx) => ({
      success: ctx.session?.flashMessages.get('success'),
      error: ctx.session?.flashMessages.get('error'),
    }),
    user: (ctx) => {
      const u = ctx.auth?.user
      if (!u) return null
      return {
        id: u.id,
        email: u.email,
        nome: u.nome,
        role: u.role,
        tenantId: u.tenantId,
      }
    },
    tenant: (ctx) => {
      const t = (ctx as any).tenant
      if (!t) return null
      return { id: t.id, nome: t.nome, pixKey: t.pixKey }
    },
  },

  ssr: {
    enabled: false,
  },
})

export default inertiaConfig

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {}
}
