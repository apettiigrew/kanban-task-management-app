import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
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
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    
    const validatedData = validateRequestBody(reorderChecklistsSchema, body)

    // Check if card exists and belongs to the authenticated user
    const card = await prisma.card.findUnique({
      where: { id: validatedData.cardId, userId },
    })

    if (!card) {
      throw new NotFoundError('Card')
    }

    // Update each checklist's order in a transaction, scoped to the authenticated user
    await prisma.$transaction(
      validatedData.checklistOrders.map(({ id, order }) =>
        prisma.checklist.update({
          where: { id, userId },
          data: { order },
        })
      )
    )

    return createSuccessResponse(null, 'Checklists reordered successfully')
  } catch (error) {
    return handleAPIError(error, '/api/checklists/reorder')
  }
}
