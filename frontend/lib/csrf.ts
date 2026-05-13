/** Lê o cookie XSRF-TOKEN definido pelo @adonisjs/shield. */
export function readXsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}
