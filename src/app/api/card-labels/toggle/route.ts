import { NextRequest } from 'next/server'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'
import { TCardLabel } from '@/models/label'
import { z } from 'zod'

const toggleCardLabelSchema = z.object({
  cardId: z.string().cuid(),
  labelId: z.string().cuid(),
})

// POST /api/card-labels/toggle - Toggle a card label (create if not exists, update if exists)
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(toggleCardLabelSchema, body)
    const { cardId, labelId } = validatedData

    const cardLabel = await queryAsUser(userId, async (tx) => {
      const card = await tx.card.findUnique({
        where: { id: cardId, userId },
        select: { projectId: true },
      })
      if (!card) throw new NotFoundError('Card')

      const label = await tx.label.findUnique({
        where: { id: labelId, userId },
        select: { projectId: true },
      })
      if (!label) throw new NotFoundError('Label')

      if (card.projectId !== label.projectId) throw new NotFoundError('Label')

      const existing = await tx.cardLabel.findUnique({
        where: { cardId_labelId: { cardId, labelId } },
      })

      if (existing) {
        return tx.cardLabel.update({
          where: { cardId_labelId: { cardId, labelId } },
          data: { checked: !existing.checked },
        })
      }

      return tx.cardLabel.create({
        data: { cardId, labelId, checked: true, userId },
      })
    })

    return createSuccessResponse(cardLabel, 'Card label toggled successfully')
  } catch (error) {
    return handleAPIError(error, '/api/card-labels/toggle')
  }
}
