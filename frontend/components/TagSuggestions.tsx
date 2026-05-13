import { useEffect, useRef, useState } from 'react'
import { useDebouncedCallback } from '@/lib/useDebounce'

type Suggestion = { tag: string; count: number }

/**
 * Memória muscular da loja: tags mais usadas pelo lojista.
 * - Debounce de 300ms (referência estável → não cria loop em useEffect).
 * - Aborta requests in-flight quando o query muda.
 * - Chips brutalist táteis: hover empurra, click "afunda".
 */
export function TagSuggestions({
  query,
  onPick,
}: {
  query: string
  onPick: (tag: string) => void
}) {
  const [items, setItems] = useState<Suggestion[]>([])
  const [bootstrapped, setBootstrapped] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const fetchTags = useDebouncedCallback(async (q: string) => {
    // cancela qualquer request em voo antes de disparar o novo
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const res = await fetch(`/tags/sugestoes?q=${encodeURIComponent(q)}`, {
        credentials: 'include',
        headers: { accept: 'application/json', 'x-requested-with': 'XMLHttpRequest' },
        signal: ctrl.signal,
      })
      if (!res.ok) {
        setItems([])
        return
      }
      const data = (await res.json()) as { items: Suggestion[] }
      setItems(data.items ?? [])
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      setItems([])
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null
      setBootstrapped(true)
    }
  }, 300)

  // Dispara apenas quando o texto realmente muda. fetchTags tem ref estável.
  useEffect(() => {
    fetchTags(query)
  }, [query, fetchTags])

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    []
  )

  if (!bootstrapped || items.length === 0) return null

  return (
    <div className="mt-2">
      <div className="text-[10px] font-black uppercase tracking-widest mb-2 text-black border-b-2 border-black pb-1">
        Mais usadas {query.trim() && <span className="text-neutral-600">— filtro: "{query.trim()}"</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((s) => (
          <button
            key={s.tag}
            type="button"
            onClick={() => onPick(s.tag)}
            title={`Usada ${s.count} vez(es)`}
            className="
              px-3 py-2 border-2 border-black bg-yellow-300 text-black
              font-black uppercase tracking-widest text-xs
              cursor-pointer inline-flex items-center gap-1 whitespace-nowrap
              transition-all
              hover:-translate-y-1 hover:translate-x-1 hover:shadow-[2px_2px_0_0_#000]
              active:translate-y-0 active:translate-x-0 active:shadow-none
            "
          >
            {s.tag}
            <span className="text-[10px] font-mono font-bold opacity-70">×{s.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
