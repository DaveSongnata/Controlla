import { AdminLayout } from '@/components/AdminLayout'
import { BrutalCard, Money } from '@/components/Brutal'

type Props = {
  tenants: { byStatus: Record<string, number>; newLast30: number }
  usersCount: number
  clientesCount: number
  saldoGlobalCentavos: number
  requests: {
    today: number
    last30: number
    series: { day: string; count: number }[]
  }
}

function Sparkline({ data }: { data: { day: string; count: number }[] }) {
  if (data.length === 0) {
    return <div className="text-xs text-neutral-600">Sem dados ainda.</div>
  }
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-1 h-20 mt-2 border-b-2 border-black">
      {data.map((d) => {
        const h = Math.max(2, Math.round((d.count / max) * 78))
        return (
          <div
            key={d.day}
            className="flex-1 bg-[color:var(--color-action)] border-2 border-black"
            style={{ height: `${h}px` }}
            title={`${d.day}: ${d.count}`}
          />
        )
      })}
    </div>
  )
}

export default function AdminDashboard({
  tenants,
  usersCount,
  clientesCount,
  saldoGlobalCentavos,
  requests,
}: Props) {
  const total =
    (tenants.byStatus.active ?? 0) +
    (tenants.byStatus.suspended ?? 0) +
    (tenants.byStatus.blocked ?? 0)

  return (
    <AdminLayout title="Métricas">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Lojas totais</div>
          <div className="text-3xl font-black tabular mt-1">{total}</div>
        </BrutalCard>
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Ativas</div>
          <div className="text-3xl font-black tabular mt-1">
            {tenants.byStatus.active ?? 0}
          </div>
        </BrutalCard>
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Suspensas</div>
          <div className="text-3xl font-black tabular mt-1">
            {tenants.byStatus.suspended ?? 0}
          </div>
        </BrutalCard>
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Bloqueadas</div>
          <div className="text-3xl font-black tabular mt-1">
            {tenants.byStatus.blocked ?? 0}
          </div>
        </BrutalCard>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Usuários</div>
          <div className="text-2xl font-black tabular mt-1">{usersCount}</div>
        </BrutalCard>
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Clientes (total)</div>
          <div className="text-2xl font-black tabular mt-1">{clientesCount}</div>
        </BrutalCard>
        <BrutalCard className="bg-white">
          <div className="text-[10px] font-black uppercase">Novas lojas (30d)</div>
          <div className="text-2xl font-black tabular mt-1">{tenants.newLast30}</div>
        </BrutalCard>
        <BrutalCard className="bg-white col-span-2 md:col-span-3">
          <div className="text-[10px] font-black uppercase">Dívida global em aberto</div>
          <Money className="text-3xl block mt-1" centavos={saldoGlobalCentavos} />
        </BrutalCard>
      </section>

      <section>
        <h2 className="text-sm font-black uppercase mb-2">Volume de requisições</h2>
        <BrutalCard className="bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-black uppercase">Hoje</div>
              <div className="text-3xl font-black tabular mt-1">{requests.today}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase">Últimos 30d</div>
              <div className="text-3xl font-black tabular mt-1">{requests.last30}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-[10px] font-black uppercase">Últimos 14 dias</div>
            <Sparkline data={requests.series} />
          </div>
        </BrutalCard>
      </section>
    </AdminLayout>
  )
}
