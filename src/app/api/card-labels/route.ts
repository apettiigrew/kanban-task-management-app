import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCardLabelSchema } from '@/lib/validations/label'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { TCardLabel } from '@/models/label'

// POST /api/card-labels - Create a new card label relationship
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(createCardLabelSchema, body)

    // Check if the card and label exist and belong to the authenticated user
    const card = await prisma.card.findUnique({
      where: { id: validatedData.cardId, userId },
      select: { projectId: true }
    })

    if (!card) {
      throw new NotFoundError('Card')
    }

    const label = await prisma.label.findUnique({
      where: { id: validatedData.labelId, userId },
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
          cardId: validatedData.cardId,
          labelId: validatedData.labelId
        }
      }
    })

    if (existingCardLabel) {
      const cardLabel = await prisma.cardLabel.update({
        where: {
          cardId_labelId: {
            cardId: validatedData.cardId,
            labelId: validatedData.labelId
          }
        },
        data: {
          checked: validatedData.checked
        }
      })

      const response: TCardLabel = cardLabel
      return createSuccessResponse(response, 'Card label updated successfully')
    }

    const cardLabel = await prisma.cardLabel.create({
      data: {
        ...validatedData,
        userId,
      }
    })

    const response: TCardLabel = cardLabel

    return createSuccessResponse(response, 'Card label created successfully', 201)
  } catch (error) {
    return handleAPIError(error, '/api/card-labels')
  }
}
