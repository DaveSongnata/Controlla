import { Link, router, useForm } from '@inertiajs/react'
import { useMemo } from 'react'
import { LojistaLayout } from '@/components/LojistaLayout'
import { BrutalButton, BrutalCard, BrutalInput } from '@/components/Brutal'
import { useDebouncedCallback } from '@/lib/useDebounce'
import { readXsrfToken } from '@/lib/csrf'

type TagRow = { tag: string; count: number; favorited: boolean }
type Props = { search: string; tags: TagRow[] }

/**
 * Escala visual da tag pelo log da frequência — caderneta brutalist,
 * sem "tag cloud" de SaaS genérico.
 */
function sizeClass(count: number, max: number) {
  if (count === 0) return 'text-xs px-2 py-1'
  const ratio = Math.log10(count + 1) / Math.log10(max + 1)
  if (ratio > 0.85) return 'text-2xl px-4 py-2'
  if (ratio > 0.6) return 'text-lg px-3 py-2'
  if (ratio > 0.35) return 'text-sm px-3 py-1.5'
  return 'text-xs px-2 py-1'
}

export default function TagsIndex({ search, tags }: Props) {
  const novo = useForm({ tag: '' })

  const max = useMemo(() => tags.reduce((m, t) => (t.count > m ? t.count : m), 1), [tags])
  const favoritas = tags.filter((t) => t.favorited)
  const usadas = tags.filter((t) => !t.favorited && t.count > 0)

  const onSearch = useDebouncedCallback((q: string) => {
    router.get('/tags', { q }, { preserveState: true, preserveScroll: true, replace: true })
  }, 300)

  function cadastrar(e: React.FormEvent) {
    e.preventDefault()
    novo.post('/tags', {
      preserveScroll: true,
      onSuccess: () => novo.reset(),
    })
  }

  async function unfavorite(tag: string) {
    await fetch(`/tags/${encodeURIComponent(tag)}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'x-xsrf-token': readXsrfToken(),
        'x-requested-with': 'XMLHttpRequest',
      },
    })
    router.reload({ only: ['tags'] })
  }

  return (
    <LojistaLayout title="Produtos">
      <header className="mb-3">
        <h1 className="text-xl font-black uppercase">Produtos</h1>
        <p className="text-xs text-neutral-700 uppercase tracking-widest mt-1">
          Tudo que sua loja já vendeu, catalogado
        </p>
      </header>

      <BrutalCard className="bg-white mb-4">
        <div className="text-xs font-black uppercase tracking-widest mb-2">Cadastrar produto</div>
        <form onSubmit={cadastrar} className="flex gap-2">
          <BrutalInput
            placeholder="ex: cerveja, gelo, garrafão"
            value={novo.data.tag}
            onChange={(e) => novo.setData('tag', e.target.value)}
            required
            error={novo.errors.tag}
          />
          <BrutalButton type="submit" disabled={novo.processing}>
            {novo.processing ? '...' : 'Adicionar'}
          </BrutalButton>
        </form>
        <p className="text-[10px] text-neutral-700 mt-2 uppercase tracking-wider">
          Vira chip favorito no Novo Fiado. Acentos e maiúsculas são normalizados.
        </p>
      </BrutalCard>

      <BrutalInput
        className="mb-4"
        placeholder="Buscar produto..."
        defaultValue={search}
        onChange={(e) => onSearch(e.target.value)}
      />

      {favoritas.length > 0 && (
        <section className="mb-5">
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1">
            Favoritas
          </h2>
          <ul className="flex flex-wrap gap-2">
            {favoritas.map((t) => (
              <li key={t.tag} className="flex items-stretch border-2 border-black">
                <Link
                  href={`/tags/${encodeURIComponent(t.tag)}`}
                  className={`bg-yellow-300 font-black uppercase tracking-widest hover:bg-white transition-colors ${sizeClass(t.count, max)}`}
                >
                  {t.tag}{' '}
                  <span className="text-[10px] font-mono opacity-60">×{t.count}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => unfavorite(t.tag)}
                  className="px-2 border-l-2 border-black bg-white font-black hover:bg-[color:var(--color-debt)] hover:text-white"
                  title="Remover dos favoritos"
                  aria-label={`Remover ${t.tag} dos favoritos`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-[10px] font-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1">
          Em uso {search.trim() && <span className="text-neutral-600">— filtro: "{search}"</span>}
        </h2>
        {usadas.length === 0 && favoritas.length === 0 ? (
          <BrutalCard className="bg-white text-sm">
            Nenhum produto ainda. Lance um fiado com descrição (ex: "2 sabão") ou cadastre um produto acima.
          </BrutalCard>
        ) : usadas.length === 0 ? (
          <BrutalCard className="bg-white text-sm">Nenhum produto em uso casa com a busca.</BrutalCard>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {usadas.map((t) => (
              <li key={t.tag}>
                <Link
                  href={`/tags/${encodeURIComponent(t.tag)}`}
                  className={`inline-flex items-center gap-1 border-2 border-black bg-gray-200 font-black uppercase tracking-widest hover:bg-yellow-300 transition-colors ${sizeClass(t.count, max)}`}
                >
                  {t.tag}
                  <span className="text-[10px] font-mono opacity-60">×{t.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </LojistaLayout>
  )
}
