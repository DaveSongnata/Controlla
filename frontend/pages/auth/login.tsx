import { Head, useForm, usePage } from '@inertiajs/react'
import { FormEvent } from 'react'
import { BrutalButton, BrutalCard, BrutalInput } from '@/components/Brutal'
import { Flash } from '@/components/Flash'

export default function Login() {
  const { errors } = usePage().props as unknown as { errors: Record<string, string> }
  const form = useForm({ email: '', password: '' })

  function submit(e: FormEvent) {
    e.preventDefault()
    form.post('/login', { preserveScroll: true, onFinish: () => form.reset('password') })
  }

  return (
    <>
      <Head title="Entrar" />
      <main className="min-h-screen flex items-center justify-center p-4 bg-[color:var(--color-bg-alt)]">
        <BrutalCard className="w-full max-w-md">
          <h1 className="text-2xl font-black uppercase tracking-tight mb-1">Controlla</h1>
          <p className="text-sm mb-4 text-neutral-700">Entre com a conta da sua loja.</p>
          <Flash />
          <form onSubmit={submit} className="space-y-3">
            <BrutalInput
              label="E-mail"
              type="email"
              autoComplete="email"
              required
              value={form.data.email}
              onChange={(e) => form.setData('email', e.target.value)}
              error={errors?.email}
            />
            <BrutalInput
              label="Senha"
              type="password"
              autoComplete="current-password"
              required
              value={form.data.password}
              onChange={(e) => form.setData('password', e.target.value)}
              error={errors?.password}
            />
            <BrutalButton type="submit" disabled={form.processing} className="w-full">
              {form.processing ? 'Entrando...' : 'Entrar'}
            </BrutalButton>
          </form>
        </BrutalCard>
      </main>
    </>
  )
}
