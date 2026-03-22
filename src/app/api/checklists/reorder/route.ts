import { NextRequest } from 'next/server'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'
import { z } from 'zod'

const reorderChecklistsSchema = z.object({
  cardId: z.string(),
  checklistOrders: z.array(z.object({
    id: z.string(),
    order: z.number(),
  })),
})

// PATCH /api/checklists/reorder - Reorder checklists within a card
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(reorderChecklistsSchema, body)

    await queryAsUser(userId, async (tx) => {
      const card = await tx.card.findUnique({ where: { id: validatedData.cardId, userId } })
      if (!card) throw new NotFoundError('Card')

      await Promise.all(
        validatedData.checklistOrders.map(({ id, order }) =>
          tx.checklist.update({ where: { id, userId }, data: { order } })
        )
      )
    })

    return createSuccessResponse(null, 'Checklists reordered successfully')
  } catch (error) {
    return handleAPIError(error, '/api/checklists/reorder')
  }
}
