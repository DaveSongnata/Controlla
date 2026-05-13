import db from '@adonisjs/lucid/services/db'
import { sanitizeTags } from '#services/tag_sanitizer'

/** Verbos que separam "quem" de "o que" no PT-BR coloquial. */
const ACTION_VERBS = [
  'gastou',
  'comprou',
  'levou',
  'pegou',
  'fiou',
  'fiado',
  'deve',
  'devendo',
  'pegando',
  'comprando',
  'levando',
]

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  três: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  quatorze: 14,
  catorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
  cento: 100,
  duzentos: 200,
  trezentos: 300,
  quatrocentos: 400,
  quinhentos: 500,
  seiscentos: 600,
  setecentos: 700,
  oitocentos: 800,
  novecentos: 900,
  mil: 1000,
}

export type ParsedVoice = {
  parsed: boolean
  clienteId: string | null
  valorCentavos: number | null
  descricaoRaw: string
  rawTranscript: string
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function parseValor(transcript: string): number | null {
  const t = normalize(transcript).replace(/,/g, '.')

  // Tenta números com vírgula/ponto: "20,50", "100.50"
  const m1 = t.match(/(\d+(?:\.\d{1,2})?)\s*(reais?|conto|conta|pratas?)?/)
  if (m1) {
    const n = Number(m1[1])
    if (Number.isFinite(n) && n > 0) return Math.round(n * 100)
  }

  // Por extenso ("vinte reais", "cinquenta e cinco")
  const tokens = t.split(/[^a-z0-9]+/).filter(Boolean)
  let sum = 0
  let consumed = false
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i]
    if (tk === 'e') continue
    if (NUMBER_WORDS[tk] !== undefined) {
      sum += NUMBER_WORDS[tk]
      consumed = true
    } else if (consumed) {
      break
    }
  }
  if (consumed && sum > 0) return Math.round(sum * 100)
  return null
}

function splitOnVerb(transcript: string): { before: string; after: string; verbIndex: number } {
  const t = normalize(transcript)
  for (const v of ACTION_VERBS) {
    const re = new RegExp(`\\b${v}\\b`, 'i')
    const m = t.match(re)
    if (m && m.index !== undefined) {
      return {
        before: t.slice(0, m.index).trim(),
        after: t.slice(m.index + m[0].length).trim(),
        verbIndex: m.index,
      }
    }
  }
  return { before: '', after: t, verbIndex: -1 }
}

async function matchCliente(
  tenantId: string,
  candidate: string
): Promise<string | null> {
  const needle = candidate.trim()
  if (needle.length < 2) return null

  // Tenta exact + ilike + trigram similarity
  const rows = await db.rawQuery(
    `
    SELECT id, nome, similarity(nome, ?) as sim
    FROM clientes
    WHERE tenant_id = ?
      AND (nome ILIKE ? OR similarity(nome, ?) > 0.2)
    ORDER BY sim DESC NULLS LAST, nome ASC
    LIMIT 1
    `,
    [needle, tenantId, `%${needle}%`, needle]
  )
  const row = rows.rows?.[0]
  return row?.id ?? null
}

export async function parseVoice(tenantId: string, transcript: string): Promise<ParsedVoice> {
  const rawTranscript = transcript.trim()
  const valor = parseValor(rawTranscript)
  const { before, after, verbIndex } = splitOnVerb(rawTranscript)

  // Tenta resolver cliente a partir do "before" (até 4 tokens, evitando "ele/ela/marcelo")
  let clienteId: string | null = null
  if (before) {
    const tokens = before.split(/\s+/).filter(Boolean)
    const candidate = tokens.slice(-4).join(' ')
    clienteId = await matchCliente(tenantId, candidate)
  }

  // Descrição = "after" sanitizado, OR raw se split falhou.
  const descricaoRaw =
    verbIndex >= 0 && after.length > 0
      ? // Remove possíveis menções a "X reais" do fim da descrição
        after.replace(/\b\d+(?:[.,]\d{1,2})?\s*(reais?|conto|conta|pratas?)\b/i, '').trim()
      : rawTranscript

  const parsedOk = valor !== null && clienteId !== null && descricaoRaw.length > 0
  return {
    parsed: parsedOk,
    clienteId,
    valorCentavos: valor,
    descricaoRaw,
    rawTranscript,
  }
}

// Exposed for tests
export const _internal = { parseValor, splitOnVerb, normalize, sanitizeTags }
