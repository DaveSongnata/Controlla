import { useEffect, useRef, useState } from 'react'
import { BrutalButton } from './Brutal'
import { readXsrfToken } from '@/lib/csrf'

type ParsedResult = {
  parsed: boolean
  clienteId: string | null
  valorCentavos: number | null
  descricaoRaw: string
}

type SR = {
  new (): SR
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: (e: any) => void
  onerror: (e: any) => void
  onend: () => void
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: SR
    webkitSpeechRecognition?: SR
  }
}

export function VoiceCaptureButton({ onResult }: { onResult: (r: ParsedResult) => void }) {
  const [active, setActive] = useState(false)
  const [supported, setSupported] = useState(true)
  const recRef = useRef<any>(null)

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) setSupported(false)
  }, [])

  async function postTranscript(text: string) {
    try {
      const res = await fetch('/voz/parse', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          'x-xsrf-token': readXsrfToken(),
        },
        body: JSON.stringify({ transcript: text }),
      })
      if (!res.ok) {
        // Mesmo em falha, joga o texto bruto na descrição (fallback gracioso do SCOPE).
        onResult({ parsed: false, clienteId: null, valorCentavos: null, descricaoRaw: text })
        return
      }
      const data = (await res.json()) as ParsedResult
      onResult(data)
    } catch {
      onResult({ parsed: false, clienteId: null, valorCentavos: null, descricaoRaw: text })
    }
  }

  function start() {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) return
    const rec: any = new (Ctor as any)()
    rec.lang = 'pt-BR'
    rec.interimResults = false
    rec.continuous = false
    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
        .trim()
      if (text) void postTranscript(text)
    }
    rec.onerror = () => setActive(false)
    rec.onend = () => setActive(false)
    rec.start()
    recRef.current = rec
    setActive(true)
  }

  function stop() {
    recRef.current?.stop?.()
    setActive(false)
  }

  if (!supported) return null

  return (
    <BrutalButton
      type="button"
      variant={active ? 'danger' : 'ghost'}
      onClick={active ? stop : start}
      aria-pressed={active}
      title="Lançar por voz"
    >
      {active ? 'GRAVANDO...' : 'VOZ'}
    </BrutalButton>
  )
}
