import { Link, router, useForm } from '@inertiajs/react'
import { useState } from 'react'
import { LojistaLayout } from '@/components/LojistaLayout'
import { BrutalButton, BrutalCard, BrutalInput, Money, Pill } from '@/components/Brutal'
import { NovoFiadoFAB } from '@/components/NovoFiadoFAB'
import { useDebouncedCallback } from '@/lib/useDebounce'

type Cliente = {
  id: string
  nome: string
  whatsapp: string | null
  saldoCentavos: number
  altoRisco: boolean
}

type Props = { search: string; clientes: Cliente[] }

export default function ClientesIndex({ search, clientes }: Props) {
  const [showNew, setShowNew] = useState(false)
  const novo = useForm({ nome: '', whatsapp: '' })

  function submitNovo(e: React.FormEvent) {
    e.preventDefault()
    novo.post('/clientes', {
      preserveScroll: true,
      onSuccess: () => {
        novo.reset()
        setShowNew(false)
      },
    })
  }

  const onSearch = useDebouncedCallback((q: string) => {
    router.get('/clientes', { q }, { preserveState: true, preserveScroll: true, replace: true })
  }, 300)

  return (
    <LojistaLayout
      title="Clientes"
      fab={<NovoFiadoFAB clientes={clientes.map((c) => ({ id: c.id, nome: c.nome, whatsapp: c.whatsapp }))} />}
    >
      <header className="flex gap-2 items-center mb-3">
        <BrutalInput
          placeholder="Buscar..."
          defaultValue={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <BrutalButton type="button" onClick={() => setShowNew((v) => !v)}>
          {showNew ? 'Cancelar' : 'Novo'}
        </BrutalButton>
      </header>

      {showNew && (
        <BrutalCard className="mb-4 bg-white">
          <form onSubmit={submitNovo} className="space-y-2">
            <BrutalInput
              label="Nome"
              required
              value={novo.data.nome}
              onChange={(e) => novo.setData('nome', e.target.value)}
            />
            <BrutalInput
              label="WhatsApp"
              placeholder="5511999999999"
              value={novo.data.whatsapp}
              onChange={(e) => novo.setData('whatsapp', e.target.value)}
            />
            <BrutalButton type="submit" disabled={novo.processing} className="w-full">
              {novo.processing ? 'Salvando...' : 'Cadastrar cliente'}
            </BrutalButton>
          </form>
        </BrutalCard>
      )}

      {clientes.length === 0 ? (
        <BrutalCard className="bg-white text-sm">Nenhum cliente encontrado.</BrutalCard>
      ) : (
        <ul className="space-y-2">
          {clientes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clientes/${c.id}`}
                className="brutal-card bg-white flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{c.nome}</div>
                  {c.whatsapp && (
                    <div className="text-xs text-neutral-600 truncate">{c.whatsapp}</div>
                  )}
                </div>
                <div className="text-right">
                  <Money centavos={c.saldoCentavos} className={c.saldoCentavos > 0 ? 'text-[color:var(--color-debt)]' : ''} />
                  <div className="mt-1 flex justify-end gap-1">
                    {c.saldoCentavos > 0 && <Pill tone="debt">Deve</Pill>}
                    {c.altoRisco && <Pill tone="risk">Risco</Pill>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </LojistaLayout>
  )
}
