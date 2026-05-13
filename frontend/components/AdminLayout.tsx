import { Head, Link, router } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { Flash } from './Flash'

export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Head title={`Admin — ${title}`} />
      <div className="min-h-screen bg-[color:var(--color-bg-alt)]">
        <header className="border-b-2 border-black bg-black text-white">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <Link href="/admin" className="font-black uppercase tracking-tight text-lg">
              Controlla / ADMIN
            </Link>
            <button
              type="button"
              className="text-xs font-bold uppercase underline-offset-4 hover:underline"
              onClick={() => router.post('/logout')}
            >
              Sair
            </button>
          </div>
          <nav className="max-w-4xl mx-auto px-4 pb-2 flex gap-3 text-xs font-bold uppercase">
            <Link href="/admin" className="underline-offset-4 hover:underline">
              Métricas
            </Link>
            <Link href="/admin/tenants" className="underline-offset-4 hover:underline">
              Lojas
            </Link>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-4">
          <Flash />
          {children}
        </main>
      </div>
    </>
  )
}
