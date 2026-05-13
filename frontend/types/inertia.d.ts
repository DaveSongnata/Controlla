import type { PageProps as InertiaPageProps } from '@inertiajs/core'

export type SharedUser = {
  id: string
  email: string
  nome: string
  role: 'super_admin' | 'lojista'
  tenantId: string | null
} | null

export type SharedTenant = { id: string; nome: string; pixKey: string | null } | null

export type FlashBag = {
  success?: string
  error?: string
}

export interface SharedProps {
  user: SharedUser
  tenant: SharedTenant
  flash: FlashBag
  errors: Record<string, string>
}

declare module '@inertiajs/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface PageProps extends InertiaPageProps, SharedProps {}
}
