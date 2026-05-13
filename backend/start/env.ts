import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),
  APP_NAME: Env.schema.string.optional(),

  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  LIMITER_STORE: Env.schema.enum(['database', 'memory'] as const),

  SUPER_ADMIN_EMAIL: Env.schema.string(),
  SUPER_ADMIN_PASSWORD: Env.schema.string(),

  APP_URL: Env.schema.string(),
  VITE_DEV_URL: Env.schema.string.optional(),
})
