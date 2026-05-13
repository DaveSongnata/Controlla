import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, targets } from '@adonisjs/core/logger'

/**
 * Em PRODUÇÃO: emitimos JSON estruturado em stdout (uma linha por evento).
 *   - Pino é o motor — sem cores, sem pretty-print, sem multilinha.
 *   - Stdout (fd 1) é o que docker/loki/cloudwatch consomem nativamente.
 *   - Bindings padrão do Adonis (request_id, ip, hostname, pid) + bindings
 *     adicionados em request-scope pelo logger_bindings_middleware
 *     (tenant_id, user_id, route) ficam disponíveis em todo log da request.
 *
 * Em DEV: pino-pretty single-line para legibilidade local.
 */
const loggerConfig = defineConfig({
  default: 'app',

  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME', 'controlla'),
      level: env.get('LOG_LEVEL'),

      // Bindings base globais — entram em todos os eventos.
      base: {
        service: 'controlla',
        env: env.get('NODE_ENV'),
      },

      // ISO 8601 com Z (UTC) — interopera com qualquer parser de log.
      timestamp: () => `,"time":"${new Date().toISOString()}"`,

      // Em prod: SEM transport → Pino escreve raw JSON direto em stdout.
      // Em dev: pretty target apenas; cores, single-line.
      ...(app.inProduction
        ? {}
        : {
            transport: {
              targets: targets()
                .push(targets.pretty({ singleLine: true, ignore: 'pid,hostname' }))
                .toArray(),
            },
          }),
    },
  },
})

export default loggerConfig

declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
