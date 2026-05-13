import { Head } from '@inertiajs/react'
import { useState } from 'react'
import { BrutalButton, BrutalCard, Money, Pill } from '@/components/Brutal'

type Entry = {
  tipo: 'divida' | 'pagamento'
  id: string
  createdAt: string
  valorCentavos: number
  descricaoTags: string[]
  descricaoRaw: string | null
}

type Props = {
  lojaNome: string
  pixKey: string | null
  cliente: { nome: string }
  saldoCentavos: number
  extrato: Entry[]
}

export default function ClientePortal({ lojaNome, pixKey, cliente, saldoCentavos, extrato }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!pixKey) return
    try {
      await navigator.clipboard.writeText(pixKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      /* noop */
    }
  }

  return (
    <>
      <Head title={`${cliente.nome} — ${lojaNome}`} />
      <main className="min-h-screen p-4 bg-[color:var(--color-bg-alt)]">
        <div className="max-w-md mx-auto">
          <header className="mb-3">
            <div className="text-xs font-black uppercase tracking-wider">{lojaNome}</div>
            <h1 className="text-2xl font-black uppercase mt-1">{cliente.nome}</h1>
          </header>

          <BrutalCard className="bg-white mb-4 text-center">
            <div className="text-[10px] font-black uppercase">Você deve</div>
            <Money
              className="text-4xl block mt-1 text-[color:var(--color-debt)]"
              centavos={saldoCentavos}
            />
          </BrutalCard>

          {saldoCentavos > 0 && (
            <BrutalCard className="bg-white mb-4">
              <div className="text-[10px] font-black uppercase mb-2">Como pagar</div>
              {pixKey ? (
                <>
                  <div className="text-xs mb-2">Chave PIX:</div>
                  <div className="brutal-card bg-[color:var(--color-bg-alt)] mb-3 break-words">
                    <span className="font-mono">{pixKey}</span>
                  </div>
                  <BrutalButton type="button" onClick={copy} className="w-full">
                    {copied ? 'Copiado!' : 'Copiar chave PIX'}
                  </BrutalButton>
                </>
              ) : (
                <div className="text-sm text-neutral-700">
                  A loja ainda não cadastrou chave PIX. Combine o pagamento direto com ela.
                </div>
              )}
            </BrutalCard>
          )}

          <h2 className="text-sm font-black uppercase mb-2">Histórico</h2>
          {extrato.length === 0 ? (
            <BrutalCard className="bg-white text-sm">Sem lançamentos.</BrutalCard>
          ) : (
            <ul className="space-y-2">
              {extrato.map((e) => (
                <li
                  key={`${e.tipo}-${e.id}`}
                  className="brutal-card bg-white flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {e.tipo === 'divida' ? (
                        <Pill tone="debt">Fiado</Pill>
                      ) : (
                        <Pill tone="paid">Pago</Pill>
                      )}
                      <time className="text-xs text-neutral-600 tabular">
                        {new Date(e.createdAt).toLocaleString('pt-BR')}
                      </time>
                    </div>
                    {e.descricaoRaw && <div className="text-sm">{e.descricaoRaw}</div>}
                    {e.descricaoTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {e.descricaoTags.map((t) => (
                          <span
                            key={t}
                            className="bg-gray-200 border border-black font-mono text-xs text-black font-bold px-1.5 py-0.5 lowercase"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <Money
                      centavos={e.valorCentavos}
                      className={
                        e.tipo === 'divida'
                          ? 'text-[color:var(--color-debt)]'
                          : 'text-[color:var(--color-paid)]'
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  )
}
