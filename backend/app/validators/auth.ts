import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().toLowerCase().email().maxLength(200),
    password: vine.string().minLength(8).maxLength(200),
  })
)
