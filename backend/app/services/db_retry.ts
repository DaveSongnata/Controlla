/**
 * Retry com backoff exponencial + jitter para erros transitórios de
 * concorrência no PostgreSQL.
 *
 *   40001 — serialization_failure (transação preemptada por outra)
 *   40P01 — deadlock_detected
 *
 * Qualquer outro erro propaga imediatamente — não retentamos violação
 * de constraint, validação ou erro lógico.
 */

const TRANSIENT_CODES = new Set(['40001', '40P01'])

export type RetryOptions = {
  maxAttempts?: number
  baseDelayMs?: number
}

function isTransient(err: unknown): err is { code: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as any).code === 'string' &&
    TRANSIENT_CODES.has((err as any).code)
  )
}

export async function withSerializationRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseDelayMs = 50 }: RetryOptions = {}
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (!isTransient(err) || attempt === maxAttempts) {
        throw err
      }
      lastErr = err
      // Exponencial: 50ms, 100ms, 200ms... com jitter de até 100% do delay base.
      const exp = baseDelayMs * 2 ** (attempt - 1)
      const jitter = Math.random() * baseDelayMs
      await new Promise((r) => setTimeout(r, exp + jitter))
    }
  }
  throw lastErr
}
