import { Link, router } from '@inertiajs/react'
import { LojistaLayout } from '@/components/LojistaLayout'
import { BrutalButton, BrutalCard, Money, Pill } from '@/components/Brutal'
import { readXsrfToken } from '@/lib/csrf'

type Totais = {
  qty: number
  totalCentavos: number
  abertoCentavos: number
  clientesDistintos: number
  ultima: string | null
}

type PorCliente = {
  id: string
  nome: string
  whatsapp: string | null
  qty: number
  totalCentavos: number
  ultima: string | null
}

type Divida = {
  id: string
  clienteId: string
  clienteNome: string
  valorCentavos: number
  saldoCentavos: number
  statusPagamento: 'aberta' | 'parcial' | 'paga'
  createdAt: string
  descricaoRaw: string | null
  descricaoTags: string[]
}

type Co = { tag: string; count: number }

type Props = {
  tag: string
  favorited: boolean
  totais: Totais
  porCliente: PorCliente[]
  dividas: Divida[]
  cooccur: Co[]
}

export default function TagShow({ tag, favorited, totais, porCliente, dividas, cooccur }: Props) {
  async function toggleFavorite() {
    if (favorited) {
      await fetch(`/tags/${encodeURIComponent(tag)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-xsrf-token': readXsrfToken(), 'x-requested-with': 'XMLHttpRequest' },
      })
    } else {
      const fd = new FormData()
      fd.append('tag', tag)
      await fetch('/tags', {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-xsrf-token': readXsrfToken(), 'x-requested-with': 'XMLHttpRequest' },
        body: fd,
      })
    }
    router.reload()
  }

  return (
    <LojistaLayout title={`#${tag}`}>
      <header className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link
            href="/tags"
            className="text-[10px] font-black uppercase tracking-widest underline-offset-4 hover:underline"
          >
            ← Tags
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tight mt-1">#{tag}</h1>
        </div>
        <BrutalButton
          type="button"
          variant={favorited ? 'danger' : 'ghost'}
          onClick={toggleFavorite}
        >
          {favorited ? 'Remover favorita' : 'Marcar como favorita'}
        </BrutalButton>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Lançamentos</div>
          <div className="text-3xl font-black tabular mt-1">{totais.qty}</div>
        </BrutalCard>
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Clientes distintos</div>
          <div className="text-3xl font-black tabular mt-1">{totais.clientesDistintos}</div>
        </BrutalCard>
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Volume total</div>
          <Money className="text-2xl block mt-1" centavos={totais.totalCentavos} />
        </BrutalCard>
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Em aberto</div>
          <Money
            className="text-2xl block mt-1 text-[color:var(--color-debt)]"
            centavos={totais.abertoCentavos}
          />
        </BrutalCard>
      </section>

      {cooccur.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1">
            Aparece junto com
          </h2>
          <ul className="flex flex-wrap gap-2">
            {cooccur.map((c) => (
              <li key={c.tag}>
                <Link
                  href={`/tags/${encodeURIComponent(c.tag)}`}
                  className="inline-flex items-center gap-1 border-2 border-black bg-gray-200 hover:bg-yellow-300 transition-colors px-2 py-1 font-black uppercase tracking-widest text-xs"
                >
                  {c.tag}
                  <span className="text-[10px] font-mono opacity-60">×{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-4">
        <h2 className="text-[10px] font-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1">
          Quem comprou
        </h2>
        {porCliente.length === 0 ? (
          <BrutalCard className="bg-white text-sm">Sem registros.</BrutalCard>
        ) : (
          <ul className="space-y-2">
            {porCliente.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clientes/${c.id}`}
                  className="brutal-card bg-white flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{c.nome}</div>
                    <div className="text-xs text-neutral-600 truncate">
                      {c.qty} compra{c.qty !== 1 ? 's' : ''} ·{' '}
                      {c.ultima ? new Date(c.ultima).toLocaleDateString('pt-BR') : '—'}
                    </div>
                  </div>
                  <Money centavos={c.totalCentavos} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-[10px] font-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1">
          Últimas {dividas.length} dívidas com essa tag
        </h2>
        {dividas.length === 0 ? (
          <BrutalCard className="bg-white text-sm">Sem registros.</BrutalCard>
        ) : (
          <ul className="space-y-2">
            {dividas.map((d) => (
              <li key={d.id} className="brutal-card bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link
                        href={`/clientes/${d.clienteId}`}
                        className="font-bold hover:underline"
                      >
                        {d.clienteNome}
                      </Link>
                      {d.statusPagamento === 'aberta' && <Pill tone="debt">Aberta</Pill>}
                      {d.statusPagamento === 'parcial' && <Pill>Parcial</Pill>}
                      {d.statusPagamento === 'paga' && <Pill tone="paid">Quitada</Pill>}
                      <time className="text-xs text-neutral-600 tabular">
                        {new Date(d.createdAt).toLocaleString('pt-BR')}
                      </time>
                    </div>
                    {d.descricaoRaw && <div className="text-sm">{d.descricaoRaw}</div>}
                    {d.descricaoTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {d.descricaoTags.map((t) => (
                          <span
                            key={t}
                            className={`font-mono text-xs font-bold px-1.5 py-0.5 border border-black lowercase ${
                              t === tag
                                ? 'bg-yellow-300 text-black'
                                : 'bg-gray-200 text-black'
                            }`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <Money
                      centavos={d.valorCentavos}
                      className="text-[color:var(--color-debt)]"
                    />
                    {d.statusPagamento !== 'paga' && (
                      <div className="text-[10px] mt-1 uppercase font-bold">
                        Saldo: <Money centavos={d.saldoCentavos} />
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </LojistaLayout>
  )
}
