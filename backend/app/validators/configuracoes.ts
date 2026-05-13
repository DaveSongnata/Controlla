import vine from '@vinejs/vine'

export const configuracoesUpdateValidator = vine.compile(
  vine.object({
    nome: vine.string().trim().minLength(2).maxLength(120),
    pixKey: vine.string().trim().maxLength(200).optional().nullable(),
  })
)
