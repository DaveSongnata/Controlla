import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { parseVoice } from '#services/voice_parser'
import { voiceThrottle } from '#start/limiter'

const voiceValidator = vine.compile(
  vine.object({
    transcript: vine.string().trim().minLength(1).maxLength(500),
  })
)

export default class VoiceController {
  async parse(ctx: HttpContext) {
    const { request, response, tenant } = ctx
    const { transcript } = await request.validateUsing(voiceValidator)

    const key = `voice_${tenant.id}_${request.ip()}`
    const [error, parsed] = await voiceThrottle.penalize(key, async () => {
      return parseVoice(tenant.id, transcript)
    })

    if (error) {
      return response.tooManyRequests({ error: 'Muitas tentativas. Aguarde.' })
    }
    return response.json(parsed)
  }
}
