import { useCallback, useEffect, useRef } from 'react'

/**
 * Retorna uma função ESTÁVEL (mesma referência entre renders) que dispara
 * `fn` apenas após `ms` sem novas chamadas. Cancela ao desmontar.
 *
 * IMPORTANTE: a referência precisa ser estável para que seja seguro
 * incluí-la em deps de `useEffect` sem causar loop.
 */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, ms = 300) {
  const fnRef = useRef(fn)
  fnRef.current = fn

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  return useCallback(
    (...args: A) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => fnRef.current(...args), ms)
    },
    [ms]
  )
}
