import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { lancamentoThrottle } from '#start/limiter'

const SessionController = () => import('#controllers/auth/session_controller')
const HealthController = () => import('#controllers/health_controller')
const DashboardController = () => import('#controllers/lojista/dashboard_controller')
const ClientesController = () => import('#controllers/lojista/clientes_controller')
const LancamentosController = () => import('#controllers/lojista/lancamentos_controller')
const ConfiguracoesController = () => import('#controllers/lojista/configuracoes_controller')
const TagsAutocompleteController = () =>
  import('#controllers/lojista/tags_autocomplete_controller')
const TagsController = () => import('#controllers/lojista/tags_controller')
const VoiceController = () => import('#controllers/lojista/voice_controller')
const PortalController = () => import('#controllers/portal/cliente_portal_controller')
const AdminTenantsController = () => import('#controllers/super_admin/tenants_controller')
const AdminMetricsController = () => import('#controllers/super_admin/metrics_controller')

// Matchers — :id sempre UUID (404 instantâneo em enumeração com int),
// :token base64url do magic-link, :tag minúsculas alfanuméricas.
const UUID = /^[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/
const TAG = /^[a-z0-9]{2,60}$/
const TOKEN = /^[A-Za-z0-9_-]{20,80}$/

// Public
router.on('/').renderInertia('home').as('home')
router.get('/health', [HealthController, 'show']).as('health')

// Auth (guest only)
router
  .group(() => {
    router.get('/login', [SessionController, 'show']).as('auth.show')
    router.post('/login', [SessionController, 'store']).as('auth.store')
  })
  .middleware(middleware.guest())

router.post('/logout', [SessionController, 'destroy']).as('auth.destroy').use(middleware.auth())

// Portal público (fora de auth + tenantScope)
router.get('/c/:token', [PortalController, 'show']).as('portal.show').where('token', TOKEN)

// Painel do lojista
router
  .group(() => {
    router.get('/painel', [DashboardController, 'index']).as('lojista.dashboard')

    router.get('/clientes', [ClientesController, 'index']).as('lojista.clientes.index')
    router.post('/clientes', [ClientesController, 'store']).as('lojista.clientes.store')
    router
      .get('/clientes/:id', [ClientesController, 'show'])
      .as('lojista.clientes.show')
      .where('id', UUID)
    router
      .post('/clientes/:id/magic-link', [ClientesController, 'magicLink'])
      .as('lojista.clientes.magicLink')
      .where('id', UUID)
    router
      .post('/clientes/:id/enviar-cobranca', [ClientesController, 'enviarCobranca'])
      .as('lojista.clientes.enviarCobranca')
      .where('id', UUID)

    router
      .post('/lancamentos/fiado', [LancamentosController, 'storeFiado'])
      .as('lojista.lancamentos.fiado')
      .use(lancamentoThrottle)
    router
      .post('/lancamentos/pagamento', [LancamentosController, 'storePagamento'])
      .as('lojista.lancamentos.pagamento')
      .use(lancamentoThrottle)

    router.get('/configuracoes', [ConfiguracoesController, 'edit']).as('lojista.configuracoes.edit')
    router
      .patch('/configuracoes', [ConfiguracoesController, 'update'])
      .as('lojista.configuracoes.update')

    // Static antes da :tag dinâmica
    router.get('/tags/sugestoes', [TagsAutocompleteController, 'index']).as(
      'lojista.tags.sugestoes'
    )
    router.get('/tags', [TagsController, 'index']).as('lojista.tags.list')
    router.post('/tags', [TagsController, 'store']).as('lojista.tags.store')
    router
      .get('/tags/:tag', [TagsController, 'show'])
      .as('lojista.tags.show')
      .where('tag', TAG)
    router
      .delete('/tags/:tag', [TagsController, 'destroy'])
      .as('lojista.tags.destroy')
      .where('tag', TAG)

    router.post('/voz/parse', [VoiceController, 'parse']).as('lojista.voz.parse')
  })
  .middleware([middleware.auth(), middleware.tenantScope()])

// Super admin
router
  .group(() => {
    router.get('/admin', [AdminMetricsController, 'index']).as('admin.dashboard')
    router.get('/admin/tenants', [AdminTenantsController, 'index']).as('admin.tenants.index')
    router.get('/admin/tenants/create', [AdminTenantsController, 'create']).as('admin.tenants.create')
    router.post('/admin/tenants', [AdminTenantsController, 'store']).as('admin.tenants.store')
    router
      .patch('/admin/tenants/:id/status', [AdminTenantsController, 'updateStatus'])
      .as('admin.tenants.updateStatus')
      .where('id', UUID)
  })
  .middleware([middleware.auth(), middleware.superAdmin()])
