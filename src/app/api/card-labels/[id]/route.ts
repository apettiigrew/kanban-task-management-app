import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCardLabelSchema } from '@/lib/validations/label'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody,
  NotFoundError 
} from '@/lib/api-error-handler'
import { TCardLabel } from '@/models/label'

// GET /api/card-labels/[id] - Get a specific card label
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const cardLabel = await prisma.cardLabel.findUnique({
      where: { id },
      include: {
        label: true
      }
    })

    if (!cardLabel) {
      throw new NotFoundError('Card label')
    }

    const response: TCardLabel = cardLabel

    return createSuccessResponse(response, 'Card label fetched successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/card-labels/${id}`)
  }
}

// PATCH /api/card-labels/[id] - Update a card label (mainly for checked status)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = validateRequestBody(updateCardLabelSchema, body)

    // Check if card label exists
    const existingCardLabel = await prisma.cardLabel.findUnique({
      where: { id }
    })

    if (!existingCardLabel) {
      throw new NotFoundError('Card label')
    }

    const cardLabel = await prisma.cardLabel.update({
      where: { id },
      data: validatedData
    })

    const response: TCardLabel = cardLabel

    return createSuccessResponse(response, 'Card label updated successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/card-labels/${id}`)
  }
}

// DELETE /api/card-labels/[id] - Delete a card label
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Check if card label exists
    const existingCardLabel = await prisma.cardLabel.findUnique({
      where: { id }
    })

    if (!existingCardLabel) {
      throw new NotFoundError('Card label')
    }

    await prisma.cardLabel.delete({
      where: { id }
    })

    return createSuccessResponse(null, 'Card label deleted successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/card-labels/${id}`)
  }
}
