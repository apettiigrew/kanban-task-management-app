import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody 
} from '@/lib/api-error-handler'
import { z } from 'zod'

const reorderChecklistsSchema = z.object({
  cardId: z.string(),
  checklistOrders: z.array(z.object({
    id: z.string(),
    order: z.number()
  }))
})

// PATCH /api/checklists/reorder - Reorder checklists within a card
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = validateRequestBody(reorderChecklistsSchema, body)

    // Check if card exists
    const card = await prisma.card.findUnique({
      where: { id: validatedData.cardId },
    })

    if (!card) {
      throw new Error('Card not found')
    }

    // Update each checklist's order in a transaction
    await prisma.$transaction(
      validatedData.checklistOrders.map(({ id, order }) =>
        prisma.checklist.update({
          where: { id },
          data: { order },
        })
      )
    )

    return createSuccessResponse(null, 'Checklists reordered successfully')
  } catch (error) {
    return handleAPIError(error, '/api/checklists/reorder')
  }
} 