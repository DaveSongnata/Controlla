import { useForm } from '@inertiajs/react'
import { LojistaLayout } from '@/components/LojistaLayout'
import { BrutalButton, BrutalCard, BrutalInput } from '@/components/Brutal'

type Props = { tenant: { id: string; nome: string; pixKey: string | null } }

export default function Configuracoes({ tenant }: Props) {
  const form = useForm({ nome: tenant.nome, pixKey: tenant.pixKey ?? '' })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    form.patch('/configuracoes', { preserveScroll: true })
  }

  return (
    <LojistaLayout title="Configurações">
      <BrutalCard className="bg-white">
        <h2 className="text-lg font-black uppercase mb-3">Loja</h2>
        <form onSubmit={submit} className="space-y-3">
          <BrutalInput
            label="Nome da loja"
            required
            value={form.data.nome}
            onChange={(e) => form.setData('nome', e.target.value)}
            error={form.errors.nome}
          />
          <BrutalInput
            label="Chave PIX (recebimento)"
            placeholder="CPF, e-mail, telefone ou aleatória"
            value={form.data.pixKey}
            onChange={(e) => form.setData('pixKey', e.target.value)}
            error={form.errors.pixKey}
          />
          <BrutalButton type="submit" className="w-full" disabled={form.processing}>
            {form.processing ? 'Salvando...' : 'Salvar'}
          </BrutalButton>
        </form>
      </BrutalCard>
    </LojistaLayout>
  )
}
