import { usePage } from '@inertiajs/react'

export function Flash() {
  const { flash } = usePage().props as unknown as { flash: { success?: string; error?: string } }
  if (!flash?.success && !flash?.error) return null
  return (
    <div className="space-y-2 mb-4">
      {flash.success && (
        <div className="brutal-card bg-[color:var(--color-paid)] text-white py-2">
          {flash.success}
        </div>
      )}
      {flash.error && (
        <div className="brutal-card bg-[color:var(--color-debt)] text-white py-2">
          {flash.error}
        </div>
      )}
    </div>
  )
}
