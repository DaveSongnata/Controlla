import { Link } from '@inertiajs/react'
import { LojistaLayout } from '@/components/LojistaLayout'
import { BrutalCard, Money, Pill } from '@/components/Brutal'

type Devedor = {
  clienteId: string
  nome: string
  whatsapp: string | null
  saldoCentavos: number
}

type ProdutoMes = { tag: string; qty: number }

type Props = {
  totalNaRuaCentavos: number
  recebidoMesCentavos: number
  clientesCount: number
  devedores: Devedor[]
  produtosMes: ProdutoMes[]
}

export default function Dashboard({
  totalNaRuaCentavos,
  recebidoMesCentavos,
  clientesCount,
  devedores,
  produtosMes,
}: Props) {
  return (
    <LojistaLayout title="Painel">
      <section className="grid grid-cols-2 gap-3 mb-4">
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Total na rua</div>
          <Money className="text-2xl block mt-1 text-[color:var(--color-debt)]" centavos={totalNaRuaCentavos} />
        </BrutalCard>
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Recebido no mês</div>
          <Money className="text-2xl block mt-1 text-[color:var(--color-paid)]" centavos={recebidoMesCentavos} />
        </BrutalCard>
        <BrutalCard className="col-span-2 bg-white">
          <div className="text-[10px] font-black uppercase">Clientes</div>
          <div className="text-2xl font-black tabular mt-1">{clientesCount}</div>
        </BrutalCard>
      </section>

      <section className="mb-5">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-sm font-black uppercase">Produtos mais vendidos no mês</h2>
          <Link
            href="/tags"
            className="text-[10px] font-black uppercase tracking-widest underline-offset-4 hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        {produtosMes.length === 0 ? (
          <BrutalCard className="bg-white text-sm">
            Nenhum produto vendido este mês ainda.
          </BrutalCard>
        ) : (
          <div className="flex flex-wrap gap-2">
            {produtosMes.map((p, i) => (
              <Link
                key={p.tag}
                href={`/tags/${encodeURIComponent(p.tag)}`}
                className={`inline-flex items-center gap-2 border-2 border-black font-black uppercase tracking-widest hover:bg-yellow-300 transition-colors px-3 py-2 ${
                  i === 0 ? 'bg-yellow-300' : 'bg-white'
                }`}
              >
                <span className="text-[10px] font-mono opacity-60">#{i + 1}</span>
                <span className="text-sm">{p.tag}</span>
                <span className="text-[10px] font-mono opacity-60">×{p.qty}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-black uppercase mb-2">Maiores devedores</h2>
        {devedores.length === 0 ? (
          <BrutalCard className="bg-white text-sm">Ninguém deve nada agora.</BrutalCard>
        ) : (
          <ul className="space-y-2">
            {devedores.map((d) => (
              <li key={d.clienteId}>
                <Link
                  href={`/clientes/${d.clienteId}`}
                  className="brutal-card bg-white flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{d.nome}</div>
                    {d.whatsapp && (
                      <div className="text-xs text-neutral-600 truncate">{d.whatsapp}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <Money centavos={d.saldoCentavos} />
                    <div className="mt-1">
                      <Pill tone="debt">Deve</Pill>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </LojistaLayout>
  )
}
