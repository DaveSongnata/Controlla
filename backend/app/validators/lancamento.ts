import vine from '@vinejs/vine'

const valorCentavos = vine.number().withoutDecimals().min(1).max(1_000_000_000)
const idempotencyKey = vine.string().uuid().optional().nullable()

export const fiadoStoreValidator = vine.compile(
  vine.object({
    clienteId: vine.string().uuid(),
    valorCentavos,
    descricaoRaw: vine.string().trim().minLength(1).maxLength(500),
    idempotencyKey,
  })
)

export const pagamentoStoreValidator = vine.compile(
  vine.object({
    clienteId: vine.string().uuid(),
    valorCentavos,
    dividaId: vine.string().uuid().optional().nullable(),
    observacao: vine.string().trim().maxLength(500).optional().nullable(),
    idempotencyKey,
  })
)
