import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from '@inertiajs/react'
import { BrutalButton, BrutalCard, BrutalInput } from './Brutal'
import { VoiceCaptureButton } from './VoiceCaptureButton'
import { TagSuggestions } from './TagSuggestions'
import { previewTags } from '@/lib/tags'
import { useFormDraft } from '@/lib/useFormDraft'
import { useOnline } from '@/lib/useOnline'

export type ClienteOption = { id: string; nome: string; whatsapp: string | null }

type VoiceFeedback = {
  ok: boolean
  rawTranscript: string
  matchedCliente: boolean
  matchedValor: boolean
} | null

const DRAFT_KEY = 'controlla:novo_fiado_draft_v1'

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function NovoFiadoFAB({
  clientes,
  defaultClienteId,
}: {
  clientes: ClienteOption[]
  defaultClienteId?: string
}) {
  const [open, setOpen] = useState(false)
  const [voice, setVoice] = useState<VoiceFeedback>(null)
  const [networkError, setNetworkError] = useState(false)
  const [draftPrompt, setDraftPrompt] = useState<null | Record<string, any>>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const online = useOnline()

  // idempotencyKey persiste no form data — sobrevive a draft restore e retries.
  const form = useForm({
    clienteId: defaultClienteId ?? '',
    valorReais: '',
    descricaoRaw: '',
    idempotencyKey: newId(),
  })

  const draft = useFormDraft(DRAFT_KEY, form.data, (d) => form.setData(d as any))

  // Ao abrir: se há rascunho com conteúdo real, mostra prompt brutalist.
  useEffect(() => {
    if (!open) return
    const saved = draft.read()
    if (saved && (saved.valorReais || saved.descricaoRaw || saved.clienteId)) {
      setDraftPrompt(saved)
    }
  }, [open, draft])

  const tagsPreview = useMemo(() => previewTags(form.data.descricaoRaw), [form.data.descricaoRaw])

  const clienteNome = useMemo(
    () => clientes.find((c) => c.id === form.data.clienteId)?.nome ?? null,
    [clientes, form.data.clienteId]
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setNetworkError(false)
    const valor = Number(form.data.valorReais.replace(',', '.'))
    if (!Number.isFinite(valor) || valor <= 0) return
    const centavos = Math.round(valor * 100)
    form.transform((d) => ({
      clienteId: d.clienteId,
      valorCentavos: centavos,
      descricaoRaw: d.descricaoRaw,
      idempotencyKey: d.idempotencyKey,
    }))
    form.post('/lancamentos/fiado', {
      preserveScroll: true,
      onSuccess: () => {
        draft.clear()
        form.reset()
        // Nova chave para o próximo lançamento.
        form.setData('idempotencyKey', newId())
        setVoice(null)
        setOpen(false)
      },
      onError: (errors) => {
        // Sem campos de erro = não foi 422 de validação → falha de rede.
        if (Object.keys(errors).length === 0) {
          setNetworkError(true)
        }
      },
    })
  }

  function onVoiceResult(parsed: {
    parsed: boolean
    clienteId: string | null
    valorCentavos: number | null
    descricaoRaw: string
  }) {
    if (parsed.clienteId) form.setData('clienteId', parsed.clienteId)
    if (parsed.valorCentavos) form.setData('valorReais', (parsed.valorCentavos / 100).toFixed(2))
    form.setData('descricaoRaw', parsed.descricaoRaw)
    setVoice({
      ok: parsed.parsed,
      rawTranscript: parsed.descricaoRaw,
      matchedCliente: !!parsed.clienteId,
      matchedValor: !!parsed.valorCentavos,
    })
    setOpen(true)
  }

  function restoreDraft() {
    if (!draftPrompt) return
    draft.apply(draftPrompt as any)
    setDraftPrompt(null)
  }
  function discardDraft() {
    draft.clear()
    form.setData('idempotencyKey', newId())
    setDraftPrompt(null)
  }

  return (
    <>
      <button type="button" className="fab" aria-label="Novo fiado" onClick={() => setOpen(true)}>
        +
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 flex items-end sm:items-center justify-center p-2"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div ref={sheetRef} className="w-full max-w-md max-h-[95vh] overflow-y-auto">
            <BrutalCard className="bg-white">
              <header className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-black uppercase">Novo fiado</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="font-black text-xl"
                  aria-label="Fechar"
                >
                  ×
                </button>
              </header>

              {!online && (
                <div className="mb-3 border-2 border-black bg-[color:var(--color-debt)] text-white p-2 font-black uppercase tracking-widest text-xs">
                  SEM INTERNET — não envie. O texto fica salvo.
                </div>
              )}

              {networkError && online && (
                <div className="mb-3 border-2 border-black bg-[color:var(--color-debt)] text-white p-2 font-black uppercase tracking-widest text-xs">
                  Falha na conexão — o lançamento não foi salvo. Tente novamente.
                </div>
              )}

              {draftPrompt && (
                <div className="mb-3 border-2 border-black bg-yellow-300 p-2">
                  <div className="font-black uppercase tracking-widest text-[10px] mb-2">
                    Lançamento não salvo encontrado
                  </div>
                  <div className="text-xs font-mono mb-2 break-words">
                    {draftPrompt.descricaoRaw || '(sem descrição)'} ·{' '}
                    {draftPrompt.valorReais
                      ? `R$ ${String(draftPrompt.valorReais)}`
                      : '(sem valor)'}
                  </div>
                  <div className="flex gap-2">
                    <BrutalButton type="button" onClick={restoreDraft} className="flex-1">
                      Restaurar
                    </BrutalButton>
                    <BrutalButton type="button" variant="ghost" onClick={discardDraft}>
                      Descartar
                    </BrutalButton>
                  </div>
                </div>
              )}

              {voice && (
                <div className="mb-3 border-2 border-black bg-yellow-300 p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black uppercase tracking-widest text-[10px]">
                      Reconhecido por voz
                    </span>
                    <button
                      type="button"
                      onClick={() => setVoice(null)}
                      className="font-black text-sm"
                      aria-label="Limpar"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-xs font-mono mb-1 break-words">"{voice.rawTranscript}"</div>
                  <div className="flex flex-wrap gap-1 text-[10px] font-black uppercase tracking-widest">
                    <span
                      className={`border-2 border-black px-1 py-0.5 ${
                        voice.matchedCliente ? 'bg-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      Cliente: {clienteNome ?? 'NÃO RECONHECIDO'}
                    </span>
                    <span
                      className={`border-2 border-black px-1 py-0.5 ${
                        voice.matchedValor ? 'bg-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      Valor: {form.data.valorReais ? `R$ ${form.data.valorReais}` : '—'}
                    </span>
                  </div>
                  <div className="text-[10px] font-black uppercase mt-2 tracking-widest text-black">
                    Confira e ajuste antes de confirmar.
                  </div>
                </div>
              )}

              <form onSubmit={submit} className="space-y-3">
                <label className="block w-full">
                  <span className="block text-xs font-black uppercase mb-1 tracking-wider">
                    Cliente
                  </span>
                  <select
                    className="brutal-input"
                    value={form.data.clienteId}
                    onChange={(e) => form.setData('clienteId', e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <BrutalInput
                  label="Valor (R$)"
                  inputMode="decimal"
                  placeholder="0,00"
                  required
                  value={form.data.valorReais}
                  onChange={(e) => form.setData('valorReais', e.target.value)}
                />

                <div>
                  <BrutalInput
                    label="Descrição"
                    placeholder="ex: 2 sabão, 1 farinha"
                    required
                    value={form.data.descricaoRaw}
                    onChange={(e) => form.setData('descricaoRaw', e.target.value)}
                  />

                  {tagsPreview.length > 0 && (
                    <div className="mt-2">
                      <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-neutral-700">
                        Será salvo como
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tagsPreview.map((t) => (
                          <span
                            key={t}
                            className="bg-gray-200 border border-black font-mono text-xs text-black font-bold px-1.5 py-0.5 lowercase"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <TagSuggestions
                    query={form.data.descricaoRaw}
                    onPick={(tag) => {
                      const cur = form.data.descricaoRaw.trim()
                      if (cur.toLowerCase().split(/\s+/).includes(tag.toLowerCase())) return
                      form.setData('descricaoRaw', cur ? `${cur} ${tag}` : tag)
                    }}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <VoiceCaptureButton onResult={onVoiceResult} />
                  <BrutalButton
                    type="submit"
                    className={`flex-1 text-base ${form.processing ? 'cursor-not-allowed opacity-60' : ''}`}
                    disabled={form.processing || !online}
                  >
                    {form.processing ? 'PROCESSANDO...' : 'CONFIRMAR'}
                  </BrutalButton>
                </div>
              </form>
            </BrutalCard>
          </div>
        </div>
      )}
    </>
  )
}
