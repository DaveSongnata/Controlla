import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import db from '@adonisjs/lucid/services/db'

/**
 * Conta volume global de requisições por dia.
 * Fire-and-forget: nunca bloqueia o request nem propaga erro.
 * UPSERT atômico via ON CONFLICT — barato comparado ao próprio handler do request.
 */
export default class RequestCounterMiddleware {
  async handle(_ctx: HttpContext, next: NextFn) {
    db.rawQuery(
      `INSERT INTO request_metrics (day, count)
       VALUES (CURRENT_DATE, 1)
       ON CONFLICT (day) DO UPDATE SET count = request_metrics.count + 1`
    ).catch(() => undefined)
    return next()
  }
}
