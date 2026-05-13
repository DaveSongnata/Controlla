import vine from '@vinejs/vine'

export const clienteStoreValidator = vine.compile(
  vine.object({
    nome: vine.string().trim().minLength(2).maxLength(120),
    whatsapp: vine
      .string()
      .trim()
      .regex(/^\+?\d{8,15}$/)
      .optional()
      .nullable(),
  })
)
