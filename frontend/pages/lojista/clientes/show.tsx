import { router, useForm } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { LojistaLayout } from '@/components/LojistaLayout'
import { BrutalButton, BrutalCard, BrutalInput, Money, Pill } from '@/components/Brutal'
import { NovoFiadoFAB } from '@/components/NovoFiadoFAB'
import { readXsrfToken } from '@/lib/csrf'
import { useFormDraft } from '@/lib/useFormDraft'
import { useOnline } from '@/lib/useOnline'

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

type ExtratoEntry = {
  tipo: 'divida' | 'pagamento'
  id: string
  createdAt: string
  valorCentavos: number
  saldoCentavos: number
  statusPagamento: 'aberta' | 'parcial' | 'paga' | null
  descricaoTags: string[]
  descricaoRaw: string | null
  dividaId: string | null
  observacao: string | null
}

type Props = {
  cliente: {
    id: string
    nome: string
    whatsapp: string | null
    altoRisco: boolean
    diasSemMovimento: number | null
  }
  saldoCentavos: number
  extrato: ExtratoEntry[]
  pagination: { page: number; perPage: number; total: number; lastPage: number }
}

export default function ClienteShow({ cliente, saldoCentavos, extrato, pagination }: Props) {
  const [paying, setPaying] = useState(false)
  const [pagNetErr, setPagNetErr] = useState(false)
  const online = useOnline()
  const pag = useForm({ valorReais: '', idempotencyKey: newId() })

  const pagDraftKey = `controlla:pagamento_draft_v1:${cliente.id}`
  const pagDraft = useFormDraft(pagDraftKey, pag.data, (d) => pag.setData(d as any))

  // Ao expandir o painel de pagamento, restaurar rascunho se existir.
  useEffect(() => {
    if (!paying) return
    const saved = pagDraft.read()
    if (saved && saved.valorReais) {
      if (window.confirm(`Restaurar pagamento não enviado de R$ ${saved.valorReais}?`)) {
        pagDraft.apply(saved as any)
      } else {
        pagDraft.clear()
      }
    }
  }, [paying])

  function pagar(e: React.FormEvent) {
    e.preventDefault()
    setPagNetErr(false)
    const v = Number(pag.data.valorReais.replace(',', '.'))
    if (!Number.isFinite(v) || v <= 0) return
    const centavos = Math.round(v * 100)
    pag.transform(() => ({
      clienteId: cliente.id,
      valorCentavos: centavos,
      idempotencyKey: pag.data.idempotencyKey,
    }))
    pag.post('/lancamentos/pagamento', {
      preserveScroll: true,
      onSuccess: () => {
        pagDraft.clear()
        pag.reset()
        pag.setData('idempotencyKey', newId())
        setPaying(false)
      },
      onError: (errors) => {
        if (Object.keys(errors).length === 0) setPagNetErr(true)
      },
    })
  }

  const [enviando, setEnviando] = useState(false)

  function gerarLink() {
    router.post(`/clientes/${cliente.id}/magic-link`)
  }

  async function enviarCobranca() {
    setEnviando(true)
    try {
      const res = await fetch(`/clientes/${cliente.id}/enviar-cobranca`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          accept: 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          'x-xsrf-token': readXsrfToken(),
        },
      })
      if (!res.ok) {
        alert('Não foi possível gerar a cobrança.')
        return
      }
      const data = (await res.json()) as {
        magicUrl: string
        whatsappUrl: string | null
        hasWhatsapp: boolean
      }
      if (data.hasWhatsapp && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer')
      } else {
        alert(
          `Este cliente não tem WhatsApp cadastrado.\nLink gerado:\n${data.magicUrl}`
        )
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <LojistaLayout
      title={cliente.nome}
      fab={<NovoFiadoFAB clientes={[{ id: cliente.id, nome: cliente.nome, whatsapp: cliente.whatsapp }]} defaultClienteId={cliente.id} />}
    >
      <header className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-black uppercase">{cliente.nome}</h1>
          {cliente.altoRisco && <Pill tone="risk">Risco alto</Pill>}
        </div>
        {cliente.whatsapp && (
          <div className="text-sm text-neutral-700">WhatsApp: {cliente.whatsapp}</div>
        )}
        {cliente.altoRisco && cliente.diasSemMovimento !== null && (
          <div className="text-xs font-bold text-[color:var(--color-debt)] mt-1 uppercase">
            {cliente.diasSemMovimento} dias sem movimento
          </div>
        )}
      </header>

      <BrutalCard className="bg-white mb-4">
        <div className="text-[10px] font-black uppercase">Saldo devedor</div>
        <Money
          className="text-3xl block mt-1 text-[color:var(--color-debt)]"
          centavos={saldoCentavos}
        />
        <div className="flex flex-wrap gap-2 mt-3">
          <BrutalButton
            type="button"
            variant="paid"
            className="flex-1 min-w-[10rem]"
            onClick={() => setPaying((v) => !v)}
            disabled={saldoCentavos === 0}
          >
            {paying ? 'Cancelar' : 'Receber pagamento'}
          </BrutalButton>
          <BrutalButton type="button" variant="ghost" onClick={gerarLink}>
            Gerar link
          </BrutalButton>
          <BrutalButton
            type="button"
            onClick={enviarCobranca}
            disabled={enviando || saldoCentavos === 0 || !cliente.whatsapp}
            title={
              !cliente.whatsapp
                ? 'Cliente sem WhatsApp cadastrado'
                : 'Abre o WhatsApp com a cobrança pronta'
            }
          >
            {enviando ? 'Enviando...' : 'Enviar cobrança'}
          </BrutalButton>
        </div>
        {paying && (
          <div className="mt-3">
            {!online && (
              <div className="mb-2 border-2 border-black bg-[color:var(--color-debt)] text-white p-2 font-black uppercase tracking-widest text-xs">
                SEM INTERNET — não envie. O valor fica salvo.
              </div>
            )}
            {pagNetErr && online && (
              <div className="mb-2 border-2 border-black bg-[color:var(--color-debt)] text-white p-2 font-black uppercase tracking-widest text-xs">
                Falha na conexão — o pagamento não foi salvo.
              </div>
            )}
            <form onSubmit={pagar} className="flex gap-2">
              <BrutalInput
                inputMode="decimal"
                placeholder="0,00"
                value={pag.data.valorReais}
                onChange={(e) => pag.setData('valorReais', e.target.value)}
                required
              />
              <BrutalButton
                type="submit"
                variant="paid"
                disabled={pag.processing || !online}
                className={pag.processing ? 'cursor-not-allowed opacity-60' : ''}
              >
                {pag.processing ? 'PROCESSANDO...' : 'OK'}
              </BrutalButton>
            </form>
          </div>
        )}
      </BrutalCard>

      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-black uppercase">Extrato</h2>
        <span className="text-[10px] font-bold uppercase text-neutral-700 tracking-widest">
          {pagination.total} lançamento{pagination.total === 1 ? '' : 's'}
        </span>
      </div>
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
                    <Pill tone="paid">Pagamento</Pill>
                  )}
                  {e.statusPagamento === 'parcial' && <Pill>Parcial</Pill>}
                  {e.statusPagamento === 'paga' && <Pill tone="paid">Quitada</Pill>}
                  <time className="text-xs text-neutral-600 tabular">
                    {new Date(e.createdAt).toLocaleString('pt-BR')}
                  </time>
                </div>
                {e.descricaoRaw && (
                  <div className="text-sm truncate">{e.descricaoRaw}</div>
                )}
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
                {e.observacao && (
                  <div className="text-xs text-neutral-600 mt-1">{e.observacao}</div>
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

      {pagination.lastPage > 1 && (
        <nav
          className="mt-4 flex items-center justify-between gap-3 border-t-2 border-black pt-3"
          aria-label="Paginação do extrato"
        >
          <BrutalButton
            type="button"
            variant="ghost"
            onClick={() =>
              router.get(
                `/clientes/${cliente.id}`,
                { page: pagination.page - 1 },
                { preserveScroll: true, preserveState: true }
              )
            }
            disabled={pagination.page <= 1}
          >
            ← Anterior
          </BrutalButton>
          <div className="text-xs font-black uppercase tracking-widest tabular">
            Página {pagination.page} de {pagination.lastPage}
          </div>
          <BrutalButton
            type="button"
            variant="ghost"
            onClick={() =>
              router.get(
                `/clientes/${cliente.id}`,
                { page: pagination.page + 1 },
                { preserveScroll: true, preserveState: true }
              )
            }
            disabled={pagination.page >= pagination.lastPage}
          >
            Próxima →
          </BrutalButton>
        </nav>
      )}
    </LojistaLayout>
  )
}
