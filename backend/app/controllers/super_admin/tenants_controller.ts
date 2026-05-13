import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import Tenant from '#models/tenant'
import User from '#models/user'
import { recordAudit } from '#services/audit_service'

const updateStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['active', 'suspended', 'blocked']),
  })
)

const createTenantValidator = vine.compile(
  vine.object({
    nome: vine.string().trim().minLength(2).maxLength(120),
    pixKey: vine.string().trim().maxLength(200).optional(),
    ownerNome: vine.string().trim().minLength(2).maxLength(120),
    ownerEmail: vine
      .string()
      .trim()
      .email()
      .normalizeEmail()
      .unique(async (_db, value) => {
        const row = await db.from('users').where('email', value).first()
        return !row
      }),
    ownerPassword: vine.string().minLength(8).maxLength(128),
  })
)

export default class TenantsController {
  async index({ inertia, request }: HttpContext) {
    const search = (request.input('q') ?? '').toString().trim()

    const query = db
      .from('tenants as t')
      .leftJoin('users as u', 'u.tenant_id', 't.id')
      .leftJoin('clientes as c', 'c.tenant_id', 't.id')
      .groupBy('t.id', 't.nome', 't.status', 't.pix_key', 't.created_at')
      .select(
        't.id',
        't.nome',
        't.status',
        't.pix_key',
        't.created_at',
        db.raw('COUNT(DISTINCT u.id) as users_count'),
        db.raw('COUNT(DISTINCT c.id) as clientes_count')
      )
      .orderBy('t.created_at', 'desc')

    if (search.length) {
      query.whereRaw('lower(immutable_unaccent(t.nome)) LIKE lower(immutable_unaccent(?))', [`%${search}%`])
    }

    const rows = await query

    return inertia.render('super_admin/tenants/index', {
      search,
      tenants: rows.map((r: any) => ({
        id: r.id,
        nome: r.nome,
        status: r.status,
        pixKey: r.pix_key,
        createdAt: r.created_at,
        usersCount: Number(r.users_count ?? 0),
        clientesCount: Number(r.clientes_count ?? 0),
      })),
    })
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('super_admin/tenants/create')
  }

  async store({ request, response, session }: HttpContext) {
    const data = await request.validateUsing(createTenantValidator)

    const tenant = await Tenant.create({
      nome: data.nome,
      pixKey: data.pixKey ?? null,
    })

    await User.create({
      tenantId: tenant.id,
      nome: data.ownerNome,
      email: data.ownerEmail,
      password: data.ownerPassword,
      role: 'lojista',
    })

    await recordAudit({
      action: 'CREATE_TENANT',
      entityTable: 'tenants',
      entityId: tenant.id,
      newPayload: { nome: tenant.nome, ownerEmail: data.ownerEmail },
    })

    session.flash('success', `Loja "${tenant.nome}" criada com sucesso.`)
    return response.redirect().toRoute('admin.tenants.index')
  }

  async updateStatus(ctx: HttpContext) {
    const { params, request, response, session } = ctx
    const { status } = await request.validateUsing(updateStatusValidator)
    const tenant = await Tenant.find(params.id)
    if (!tenant) return response.notFound()
    const oldStatus = tenant.status
    tenant.status = status
    await tenant.save()

    await recordAudit({
      action: 'UPDATE_TENANT_STATUS',
      entityTable: 'tenants',
      entityId: tenant.id,
      oldPayload: { status: oldStatus },
      newPayload: { status },
    })

    session.flash('success', `Loja "${tenant.nome}" agora está ${status}.`)
    return response.redirect().toRoute('admin.tenants.index')
  }
}
