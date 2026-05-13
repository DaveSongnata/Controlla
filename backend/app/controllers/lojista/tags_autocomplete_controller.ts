import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { sanitizeTags } from '#services/tag_sanitizer'

export default class TagsAutocompleteController {
  async index({ request, tenant, response }: HttpContext) {
    const raw = (request.input('q') ?? '').toString().trim()
    const [needle] = sanitizeTags(raw)
    const limit = Math.min(Number.parseInt(request.input('limit') ?? '10', 10) || 10, 50)

    // Une tags usadas (com frequência) + favoritas (frequência 0 se nunca usadas).
    // Favoritas sobem por priority desc.
    const rows = await db.rawQuery(
      `
      WITH used AS (
        SELECT tag, COUNT(*)::int AS count
        FROM dividas, jsonb_array_elements_text(descricao_tags) tag
        WHERE tenant_id = ?
        GROUP BY tag
      ),
      favs AS (
        SELECT tag FROM tag_favorites WHERE tenant_id = ?
      ),
      merged AS (
        SELECT
          COALESCE(u.tag, f.tag)          AS tag,
          COALESCE(u.count, 0)            AS count,
          (f.tag IS NOT NULL)::int        AS favorited
        FROM used u
        FULL OUTER JOIN favs f USING (tag)
      )
      SELECT tag, count, favorited::bool AS favorited
      FROM merged
      WHERE (? = '' OR tag LIKE ?)
      ORDER BY favorited DESC, count DESC, tag ASC
      LIMIT ?
      `,
      [tenant.id, tenant.id, needle ?? '', `${needle ?? ''}%`, limit]
    )

    return response.json({
      items: rows.rows.map((r: any) => ({
        tag: r.tag,
        count: Number(r.count ?? 0),
        favorited: !!r.favorited,
      })),
    })
  }
}
