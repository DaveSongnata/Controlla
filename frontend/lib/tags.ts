/**
 * Espelho client-side do pipeline de sanitização do backend
 * (app/services/tag_sanitizer.ts). Usado apenas para PREVIEW visual —
 * o backend é a fonte da verdade e roda a mesma transformação no save.
 */
const STOPWORDS = new Set([
  'o', 'a', 'os', 'as', 'e', 'de', 'do', 'da', 'dos', 'das',
  'com', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'uns', 'umas',
  'pra', 'para', 'por', 'pro', 'pelo', 'pela',
])

export function previewTags(input: string | null | undefined): string[] {
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
