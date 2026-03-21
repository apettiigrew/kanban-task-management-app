import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
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

    // Check if the card and label exist and belong to the authenticated user
    const card = await prisma.card.findUnique({
      where: { id: cardId, userId },
      select: { projectId: true }
    })

    if (!card) {
      throw new NotFoundError('Card')
    }

    const label = await prisma.label.findUnique({
      where: { id: labelId, userId },
      select: { projectId: true }
    })

    if (!label) {
      throw new NotFoundError('Label')
    }

    if (card.projectId !== label.projectId) {
      throw new NotFoundError('Label')
    }

    // Check if the relationship already exists
    const existingCardLabel = await prisma.cardLabel.findUnique({
      where: {
        cardId_labelId: {
          cardId: cardId,
          labelId: labelId
        }
      }
    })

    let cardLabel: TCardLabel

    if (existingCardLabel) {
      cardLabel = await prisma.cardLabel.update({
        where: {
          cardId_labelId: {
            cardId: cardId,
            labelId: labelId
          }
        },
        data: {
          checked: !existingCardLabel.checked
        }
      })
    } else {
      cardLabel = await prisma.cardLabel.create({
        data: {
          cardId: cardId,
          labelId: labelId,
          checked: true,
          userId,
        }
      })
    }

    return createSuccessResponse(cardLabel, 'Card label toggled successfully')
  } catch (error) {
    return handleAPIError(error, '/api/card-labels/toggle')
  }
}
