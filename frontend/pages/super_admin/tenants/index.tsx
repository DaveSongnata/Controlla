import { router } from '@inertiajs/react'
import { AdminLayout } from '@/components/AdminLayout'
import { BrutalButton, BrutalCard, BrutalInput, Pill } from '@/components/Brutal'
import { useDebouncedCallback } from '@/lib/useDebounce'

type Tenant = {
  id: string
  nome: string
  status: 'active' | 'suspended' | 'blocked'
  pixKey: string | null
  createdAt: string
  usersCount: number
  clientesCount: number
}

type Props = { search: string; tenants: Tenant[] }

const STATUS_TONE: Record<Tenant['status'], 'paid' | 'risk' | 'debt'> = {
  active: 'paid',
  suspended: 'risk',
  blocked: 'debt',
}
const STATUS_LABEL: Record<Tenant['status'], string> = {
  active: 'Ativa',
  suspended: 'Suspensa',
  blocked: 'Bloqueada',
}

export default function AdminTenantsIndex({ search, tenants }: Props) {
  const onSearch = useDebouncedCallback((q: string) => {
    router.get(
      '/admin/tenants',
      { q },
      { preserveState: true, preserveScroll: true, replace: true }
    )
  }, 300)

  function updateStatus(id: string, status: Tenant['status']) {
    router.patch(`/admin/tenants/${id}/status`, { status }, { preserveScroll: true })
  }

  return (
    <AdminLayout title="Lojas">
      <div className="flex gap-2 mb-3">
        <BrutalInput
          className="flex-1"
          placeholder="Buscar loja..."
          defaultValue={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <BrutalButton variant="paid" onClick={() => router.get('/admin/tenants/create')}>
          + Nova Loja
        </BrutalButton>
      </div>
      {tenants.length === 0 ? (
        <BrutalCard className="bg-white text-sm">Nenhuma loja.</BrutalCard>
      ) : (
        <ul className="space-y-2">
          {tenants.map((t) => (
            <li key={t.id} className="brutal-card bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-bold truncate">{t.nome}</div>
                    <Pill tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Pill>
                  </div>
                  <div className="text-xs text-neutral-600">
                    {t.usersCount} usuários · {t.clientesCount} clientes · criada em{' '}
                    {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  {t.pixKey && (
                    <div className="text-xs text-neutral-600 mt-1 font-mono truncate">
                      PIX: {t.pixKey}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <BrutalButton
                  type="button"
                  variant="paid"
                  disabled={t.status === 'active'}
                  onClick={() => updateStatus(t.id, 'active')}
                >
                  Ativar
                </BrutalButton>
                <BrutalButton
                  type="button"
                  variant="ghost"
                  disabled={t.status === 'suspended'}
                  onClick={() => updateStatus(t.id, 'suspended')}
                >
                  Suspender
                </BrutalButton>
                <BrutalButton
                  type="button"
                  variant="danger"
                  disabled={t.status === 'blocked'}
                  onClick={() => updateStatus(t.id, 'blocked')}
                >
                  Bloquear
                </BrutalButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  )
}
