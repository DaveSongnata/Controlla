import limiter from '@adonisjs/limiter/services/main'

export const loginThrottle = limiter.use({
  requests: 5,
  duration: '1 minute',
  blockDuration: '5 minutes',
})

export const portalThrottle = limiter.use({
  requests: 10,
  duration: '1 minute',
})

export const voiceThrottle = limiter.use({
  requests: 30,
  duration: '1 minute',
})

/**
 * Throttle dedicado a POST /lancamentos/*. 20/min por
 * usuário (ou IP se anônimo) — acima disso é robô/abuso.
 */
export const lancamentoThrottle = limiter.define('lancamento', (ctx) => {
  const key = ctx.auth?.user?.id ?? ctx.request.ip()
  return limiter
    .allowRequests(20)
    .every('1 minute')
    .blockFor('30 seconds')
    .usingKey(`lancamento_${key}`)
})
