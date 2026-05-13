import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

type Variant = 'action' | 'danger' | 'paid' | 'ghost'

export function BrutalButton({
  variant = 'action',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const v =
    variant === 'danger'
      ? 'brutal-btn brutal-btn--danger'
      : variant === 'paid'
        ? 'brutal-btn brutal-btn--paid'
        : variant === 'ghost'
          ? 'brutal-btn brutal-btn--ghost'
          : 'brutal-btn'
  return (
    <button className={`${v} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function BrutalInput({
  label,
  error,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <label className="block w-full">
      {label && (
        <span className="block text-xs font-black uppercase mb-1 tracking-wider">{label}</span>
      )}
      <input className={`brutal-input ${className}`} {...rest} />
      {error && <span className="block text-xs font-bold text-[color:var(--color-debt)] mt-1">{error}</span>}
    </label>
  )
}

export function BrutalCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`brutal-card ${className}`}>{children}</div>
}

export function Money({
  centavos,
  className = '',
}: {
  centavos: number | string | null | undefined
  className?: string
}) {
  const n = typeof centavos === 'string' ? Number(centavos) : (centavos ?? 0)
  const value = (n / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
  return <span className={`money ${className}`}>{value}</span>
}

export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: 'debt' | 'paid' | 'risk' | 'neutral'
  children: ReactNode
}) {
  const cls =
    tone === 'debt'
      ? 'pill pill--debt'
      : tone === 'paid'
        ? 'pill pill--paid'
        : tone === 'risk'
          ? 'pill pill--risk'
          : 'pill'
  return <span className={cls}>{children}</span>
}
