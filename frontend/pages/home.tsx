import { Head, Link } from '@inertiajs/react'

export default function Home() {
  return (
    <>
      <Head title="Controlla" />
      <main className="min-h-screen flex items-center justify-center p-4 bg-[color:var(--color-bg-alt)]">
        <section className="brutal-card max-w-md w-full text-center">
          <h1 className="text-3xl font-black uppercase mb-2">Controlla</h1>
          <p className="text-sm mb-6">Caderneta digital de fiado. Brutal. Rápida. Sua.</p>
          <Link className="brutal-btn w-full" href="/login">
            Entrar
          </Link>
        </section>
      </main>
    </>
  )
}
