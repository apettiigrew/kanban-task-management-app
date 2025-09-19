import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCardLabelSchema } from '@/lib/validations/label'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody 
} from '@/lib/api-error-handler'
import { TCardLabel } from '@/models/label'

// POST /api/card-labels - Create a new card label relationship
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = validateRequestBody(createCardLabelSchema, body)

    // Check if the card and label exist and belong to the same project
    const card = await prisma.card.findUnique({
      where: { id: validatedData.cardId },
      select: { projectId: true }
    })

    if (!card) {
      throw new Error('Card not found')
    }

    const label = await prisma.label.findUnique({
      where: { id: validatedData.labelId },
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
          cardId: validatedData.cardId,
          labelId: validatedData.labelId
        }
      }
    })

    if (existingCardLabel) {
      // If it exists, just update the checked status
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

    // Create new card label relationship
    const cardLabel = await prisma.cardLabel.create({
      data: validatedData
    })

    const response: TCardLabel = cardLabel

    return createSuccessResponse(response, 'Card label created successfully', 201)
  } catch (error) {
    return handleAPIError(error, '/api/card-labels')
  }
}
