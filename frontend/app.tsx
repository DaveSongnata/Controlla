import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import './css/app.css'

async function resolvePageComponent<T>(
  path: string,
  pages: Record<string, () => Promise<T>>
): Promise<T> {
  const page = pages[path]
  if (!page) throw new Error(`Page not found: ${path}`)
  return page()
}

const appName = 'Controlla'

createInertiaApp({
  progress: { color: '#000000', includeCSS: true, showSpinner: false },

  title: (title) => (title ? `${title} — ${appName}` : appName),

  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob<{ default: unknown }>('./pages/**/*.tsx')
    )
  },

  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
