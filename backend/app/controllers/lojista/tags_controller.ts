import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { sanitizeTags } from '#services/tag_sanitizer'
import { tagStoreValidator } from '#validators/tag'

export default class TagsController {
  /**
   * Lista todas as tags do tenant: união de tags efetivamente usadas em
   * dividas (com frequência) + tags favoritas (cadastradas manualmente).
   */
  async index({ inertia, request, tenant }: HttpContext) {
    const search = (request.input('q') ?? '').toString().trim()
    const [needle] = sanitizeTags(search)

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
          COALESCE(u.tag, f.tag) AS tag,
          COALESCE(u.count, 0)   AS count,
          (f.tag IS NOT NULL)    AS favorited
        FROM used u
        FULL OUTER JOIN favs f USING (tag)
      )
      SELECT tag, count, favorited
      FROM merged
      WHERE (? = '' OR tag LIKE ?)
      ORDER BY favorited DESC, count DESC, tag ASC
      LIMIT 200
      `,
      [tenant.id, tenant.id, needle ?? '', `${needle ?? ''}%`]
    )

    return inertia.render('lojista/tags/index', {
      search,
      tags: rows.rows.map((r: any) => ({
        tag: r.tag,
        count: Number(r.count ?? 0),
        favorited: !!r.favorited,
      })),
    })
  }

  /**
   * Detalhe de uma tag: agregação por cliente + extrato das dívidas que a contêm.
   * Usa `descricao_tags @> '["tag"]'::jsonb` para tirar proveito do índice GIN.
   */
  async show({ inertia, params, tenant, response }: HttpContext) {
    const [tag] = sanitizeTags(params.tag)
    if (!tag) return response.notFound()

    const tagJson = JSON.stringify([tag])

    const totaisRow = await db.rawQuery(
      `
      SELECT
        COUNT(*)::int                                                      AS qty,
        COALESCE(SUM(valor_centavos), 0)::bigint                           AS total_centavos,
        COALESCE(SUM(saldo_centavos) FILTER (WHERE status_pagamento <> 'paga'), 0)::bigint AS aberto_centavos,
        COUNT(DISTINCT cliente_id)::int                                    AS clientes_distintos,
        MAX(created_at)                                                    AS ultima
      FROM dividas
      WHERE tenant_id = ? AND descricao_tags @> ?::jsonb
      `,
      [tenant.id, tagJson]
    )
    const totais = totaisRow.rows?.[0] ?? {}

    const porClienteRow = await db.rawQuery(
      `
      SELECT c.id, c.nome, c.whatsapp,
             COUNT(d.id)::int                  AS qty,
             SUM(d.valor_centavos)::bigint     AS total_centavos,
             MAX(d.created_at)                 AS ultima
      FROM dividas d
      JOIN clientes c ON c.id = d.cliente_id
      WHERE d.tenant_id = ? AND d.descricao_tags @> ?::jsonb
      GROUP BY c.id, c.nome, c.whatsapp
      ORDER BY qty DESC, total_centavos DESC
      LIMIT 50
      `,
      [tenant.id, tagJson]
    )

    const dividasRow = await db.rawQuery(
      `
      SELECT d.id, d.valor_centavos, d.saldo_centavos, d.status_pagamento,
             d.created_at, d.descricao_raw, d.descricao_tags,
             c.id   AS cliente_id,
             c.nome AS cliente_nome
      FROM dividas d
      JOIN clientes c ON c.id = d.cliente_id
      WHERE d.tenant_id = ? AND d.descricao_tags @> ?::jsonb
      ORDER BY d.created_at DESC
      LIMIT 100
      `,
      [tenant.id, tagJson]
    )

    // Co-ocorrência: tags que mais aparecem JUNTO com esta.
    const cooccurRow = await db.rawQuery(
      `
      SELECT outra AS tag, COUNT(*)::int AS count
      FROM dividas, jsonb_array_elements_text(descricao_tags) outra
      WHERE tenant_id = ?
        AND descricao_tags @> ?::jsonb
        AND outra <> ?
      GROUP BY outra
      ORDER BY count DESC
      LIMIT 10
      `,
      [tenant.id, tagJson, tag]
    )

    const favRow = await db
      .from('tag_favorites')
      .where('tenant_id', tenant.id)
      .andWhere('tag', tag)
      .first()

    return inertia.render('lojista/tags/show', {
      tag,
      favorited: !!favRow,
      totais: {
        qty: Number(totais.qty ?? 0),
        totalCentavos: Number(totais.total_centavos ?? 0),
        abertoCentavos: Number(totais.aberto_centavos ?? 0),
        clientesDistintos: Number(totais.clientes_distintos ?? 0),
        ultima: totais.ultima ?? null,
      },
      porCliente: porClienteRow.rows.map((r: any) => ({
        id: r.id,
        nome: r.nome,
        whatsapp: r.whatsapp,
        qty: Number(r.qty),
        totalCentavos: Number(r.total_centavos),
        ultima: r.ultima,
      })),
      dividas: dividasRow.rows.map((r: any) => ({
        id: r.id,
        clienteId: r.cliente_id,
        clienteNome: r.cliente_nome,
        valorCentavos: Number(r.valor_centavos),
        saldoCentavos: Number(r.saldo_centavos),
        statusPagamento: r.status_pagamento,
        createdAt: r.created_at,
        descricaoRaw: r.descricao_raw,
        descricaoTags: Array.isArray(r.descricao_tags) ? r.descricao_tags : [],
      })),
      cooccur: cooccurRow.rows.map((r: any) => ({ tag: r.tag, count: Number(r.count) })),
    })
  }

  /**
   * Cadastra uma tag favorita. Mesmo pipeline de sanitização do backend
   * (NFD + lower + stopwords) para evitar "ÁGUA" e "água" virarem coisas diferentes.
   */
  async store(ctx: HttpContext) {
    const { request, response, session, tenant } = ctx
    const { tag: raw } = await request.validateUsing(tagStoreValidator)
    const [tag] = sanitizeTags(raw)
    if (!tag) {
      session.flash('error', 'Essa tag fica vazia depois de sanitizada.')
      return response.redirect().back()
    }
    // Upsert idempotente: re-clicar "Adicionar" não quebra nem duplica.
    await db.rawQuery(
      `INSERT INTO tag_favorites (tenant_id, tag)
       VALUES (?, ?)
       ON CONFLICT (tenant_id, tag) DO NOTHING`,
      [tenant.id, tag]
    )
    session.flash('success', `Tag "${tag}" cadastrada.`)
    return response.redirect().toRoute('lojista.tags.list')
  }

  async destroy({ params, response, session, tenant }: HttpContext) {
    const [tag] = sanitizeTags(params.tag)
    if (!tag) return response.redirect().back()
    await db
      .from('tag_favorites')
      .where('tenant_id', tenant.id)
      .andWhere('tag', tag)
      .delete()
    session.flash('success', `Tag "${tag}" removida dos favoritos.`)
    return response.redirect().back()
  }
}
