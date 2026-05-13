const STOPWORDS = new Set([
  'o',
  'a',
  'os',
  'as',
  'e',
  'de',
  'do',
  'da',
  'dos',
  'das',
  'com',
  'em',
  'no',
  'na',
  'nos',
  'nas',
  'um',
  'uma',
  'uns',
  'umas',
  'pra',
  'para',
  'por',
  'pro',
  'pelo',
  'pela',
])

/**
 * Pipeline de normalização "implacável":
 *   - Unicode NFD + remoção de diacríticos
 *   - lowercase
 *   - quebra em tokens por whitespace + pontuação
 *   - remove stopwords PT-BR
 *   - dedupe preservando ordem
 */
export function sanitizeTags(input: string | null | undefined): string[] {
  if (!input) return []
  const normalized = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean)

  const seen = new Set<string>()
  const out: string[] = []
  for (const t of tokens) {
    if (t.length < 2) continue
    if (STOPWORDS.has(t)) continue
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

export const _stopwordsForTest = STOPWORDS
