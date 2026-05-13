import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class HealthController {
  async show({ response }: HttpContext) {
    try {
      await db.rawQuery('SELECT 1')
      return response.json({ status: 'ok', db: 'connected' })
    } catch (err) {
      return response.status(503).json({
        status: 'error',
        db: 'disconnected',
        message: (err as Error).message,
      })
    }
  }
}
