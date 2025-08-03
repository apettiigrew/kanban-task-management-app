import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody 
} from '@/lib/api-error-handler'
import { z } from 'zod'

const reorderChecklistItemsSchema = z.object({
  checklistId: z.string(),
  itemOrders: z.array(z.object({
    id: z.string(),
    order: z.number(),
    checklistId: z.string() // Allow moving items between checklists
  }))
})

// PATCH /api/checklist-items/reorder - Reorder checklist items within or across checklists
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = validateRequestBody(reorderChecklistItemsSchema, body)

    // Check if all checklists exist
    const checklistIds = [validatedData.checklistId, ...validatedData.itemOrders.map(item => item.checklistId)]
    const uniqueChecklistIds = [...new Set(checklistIds)]
    
    const checklists = await prisma.checklist.findMany({
      where: { id: { in: uniqueChecklistIds } },
    })

    if (checklists.length !== uniqueChecklistIds.length) {
      throw new Error('One or more checklists not found')
    }

    // Update each checklist item's order and checklist in a transaction
    await prisma.$transaction(
      validatedData.itemOrders.map(({ id, order, checklistId }) =>
        prisma.checklistItem.update({
          where: { id },
          data: { 
            order,
            checklistId // This allows moving items between checklists
          },
        })
      )
    )

    return createSuccessResponse(null, 'Checklist items reordered successfully')
  } catch (error) {
    return handleAPIError(error, '/api/checklist-items/reorder')
  }
} 