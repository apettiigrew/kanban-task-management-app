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

const reorderChecklistItemsSchema = z.object({
  checklistId: z.string(),
  itemOrders: z.array(z.object({
    id: z.string(),
    order: z.number(),
    checklistId: z.string(),
  })),
})

// PATCH /api/checklist-items/reorder - Reorder checklist items within or across checklists
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(reorderChecklistItemsSchema, body)

    await queryAsUser(userId, async (tx) => {
      const checklistIds = [
        validatedData.checklistId,
        ...validatedData.itemOrders.map(item => item.checklistId),
      ]
      const uniqueChecklistIds = [...new Set(checklistIds)]

      const checklists = await tx.checklist.findMany({
        where: { id: { in: uniqueChecklistIds }, userId },
      })

      if (checklists.length !== uniqueChecklistIds.length) {
        throw new NotFoundError('One or more checklists')
      }

      await Promise.all(
        validatedData.itemOrders.map(({ id, order, checklistId }) =>
          tx.checklistItem.update({
            where: { id, userId },
            data: { order, checklistId },
          })
        )
      )
    })

    return createSuccessResponse(null, 'Checklist items reordered successfully')
  } catch (error) {
    return handleAPIError(error, '/api/checklist-items/reorder')
  }
}
