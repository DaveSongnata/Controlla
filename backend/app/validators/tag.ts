import vine from '@vinejs/vine'

export const tagStoreValidator = vine.compile(
  vine.object({
    tag: vine.string().trim().minLength(2).maxLength(60),
  })
)
