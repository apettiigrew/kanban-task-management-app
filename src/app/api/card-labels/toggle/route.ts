import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody 
} from '@/lib/api-error-handler'
import { TCardLabel } from '@/models/label'
import { z } from 'zod'

const toggleCardLabelSchema = z.object({
  cardId: z.string().cuid(),
  labelId: z.string().cuid(),
})

// POST /api/card-labels/toggle - Toggle a card label (create if not exists, update if exists)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = validateRequestBody(toggleCardLabelSchema, body)

    const { cardId, labelId } = validatedData

    // Check if the card and label exist and belong to the same project
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { projectId: true }
    })

    if (!card) {
      throw new Error('Card not found')
    }

    const label = await prisma.label.findUnique({
      where: { id: labelId },
      select: { projectId: true }
    })

    if (!label) {
      throw new Error('Label not found')
    }

    if (card.projectId !== label.projectId) {
      throw new Error('Card and label must belong to the same project')
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
      // If it exists, toggle the checked status
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
      // If it doesn't exist, create it with checked: true
      cardLabel = await prisma.cardLabel.create({
        data: {
          cardId: cardId,
          labelId: labelId,
          checked: true
        }
      })
    }

    return createSuccessResponse(cardLabel, 'Card label toggled successfully')
  } catch (error) {
    return handleAPIError(error, '/api/card-labels/toggle')
  }
}
