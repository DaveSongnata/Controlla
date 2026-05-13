import { useEffect, useRef } from 'react'
import { useDebouncedCallback } from './useDebounce'

/**
 * Persiste o estado do form em localStorage e oferece restauração ao remontar.
 *
 * Contrato:
 *  - `read()` consulta o draft salvo sem aplicar (caller decide UX da pergunta).
 *  - `apply(draft)` aplica em form via setData (Inertia).
 *  - `clear()` apaga o rascunho — chamar após submit bem-sucedido.
 *  - `save()` é o gatilho debounced que o caller invoca quando `data` muda.
 */
export function useFormDraft<T extends Record<string, unknown>>(
  key: string,
  data: T,
  setData: (data: T) => void
) {
  const ready = useRef(false)

  const persist = useDebouncedCallback(() => {
    try {
      const hasContent = Object.values(data).some(
        (v) => v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
      )
      if (hasContent) {
        localStorage.setItem(key, JSON.stringify(data))
      } else {
        localStorage.removeItem(key)
      }
    } catch {
      /* storage indisponível (modo privado) — silencia */
    }
  }, 400)

  useEffect(() => {
    if (!ready.current) {
      // Primeira passagem: não persiste estado inicial; aguarda interação.
      ready.current = true
      return
    }
    persist()
  }, [data, persist])

  return {
    read(): T | null {
      try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as T) : null
      } catch {
        return null
      }
    },
    apply(draft: T) {
      setData(draft)
    },
    clear() {
      try {
        localStorage.removeItem(key)
      } catch {
        /* idem */
      }
    },
  }
}
