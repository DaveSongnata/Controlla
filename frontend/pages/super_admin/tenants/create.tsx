import { useForm } from '@inertiajs/react'
import { AdminLayout } from '@/components/AdminLayout'
import { BrutalButton, BrutalCard, BrutalInput } from '@/components/Brutal'
import type { FormEvent } from 'react'

export default function AdminTenantsCreate() {
  const form = useForm({
    nome: '',
    pixKey: '',
    ownerNome: '',
    ownerEmail: '',
    ownerPassword: '',
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    form.post('/admin/tenants')
  }

  return (
    <AdminLayout title="Nova Loja">
      <BrutalCard className="bg-white">
        <form onSubmit={submit} className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider">Dados da Loja</h2>

          <BrutalInput
            label="Nome da Loja"
            value={form.data.nome}
            onChange={(e) => form.setData('nome', e.target.value)}
            error={form.errors.nome}
            required
            autoFocus
          />

          <BrutalInput
            label="Chave PIX (opcional)"
            value={form.data.pixKey}
            onChange={(e) => form.setData('pixKey', e.target.value)}
            error={form.errors.pixKey}
            placeholder="email, CPF, CNPJ ou chave aleatoria"
          />

          <hr className="border-black" />

          <h2 className="text-sm font-black uppercase tracking-wider">Dono (primeiro usuario)</h2>

          <BrutalInput
            label="Nome do Dono"
            value={form.data.ownerNome}
            onChange={(e) => form.setData('ownerNome', e.target.value)}
            error={form.errors.ownerNome}
            required
          />

          <BrutalInput
            label="Email"
            type="email"
            value={form.data.ownerEmail}
            onChange={(e) => form.setData('ownerEmail', e.target.value)}
            error={form.errors.ownerEmail}
            required
          />

          <BrutalInput
            label="Senha"
            type="password"
            value={form.data.ownerPassword}
            onChange={(e) => form.setData('ownerPassword', e.target.value)}
            error={form.errors.ownerPassword}
            required
            minLength={8}
          />

          <div className="flex gap-2 pt-2">
            <BrutalButton type="submit" variant="paid" disabled={form.processing}>
              {form.processing ? 'Criando...' : 'Criar Loja'}
            </BrutalButton>
            <BrutalButton
              type="button"
              variant="ghost"
              onClick={() => window.history.back()}
            >
              Cancelar
            </BrutalButton>
          </div>
        </form>
      </BrutalCard>
    </AdminLayout>
  )
}
