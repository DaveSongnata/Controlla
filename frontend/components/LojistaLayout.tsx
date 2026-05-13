import { Head, Link, router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { Flash } from './Flash'

export function LojistaLayout({
  title,
  children,
  fab,
}: {
  title: string
  children: ReactNode
  fab?: ReactNode
}) {
  const { user, tenant } = usePage().props as unknown as {
    user: { nome: string } | null
    tenant: { nome: string } | null
  }

  return (
    <>
      <Head title={title} />
      <div className="min-h-screen bg-[color:var(--color-bg-alt)] pb-24">
        <header className="border-b-2 border-black bg-white sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <Link href="/painel" className="font-black uppercase tracking-tight text-lg">
              Controlla
            </Link>
            <div className="text-xs font-bold uppercase">{tenant?.nome ?? user?.nome ?? '—'}</div>
          </div>
          <nav className="max-w-3xl mx-auto px-4 pb-2 flex gap-3 text-xs font-bold uppercase">
            <Link href="/painel" className="underline-offset-4 hover:underline">
              Painel
            </Link>
            <Link href="/clientes" className="underline-offset-4 hover:underline">
              Clientes
            </Link>
            <Link href="/tags" className="underline-offset-4 hover:underline">
              Produtos
            </Link>
            <Link href="/configuracoes" className="underline-offset-4 hover:underline">
              Loja
            </Link>
            <button
              type="button"
              className="ml-auto underline-offset-4 hover:underline"
              onClick={() => router.post('/logout')}
            >
              Sair
            </button>
          </nav>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-4">
          <Flash />
          {children}
        </main>

        {fab}
      </div>
    </>
  )
}
