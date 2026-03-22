import { NextRequest } from 'next/server'
import { updateChecklistSchema } from '@/lib/validations/checklist'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'

// GET /api/checklists/[id] - Get a specific checklist
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)

    const checklist = await queryAsUser(userId, (tx) =>
      tx.checklist.findUnique({
        where: { id, userId },
        include: { items: { orderBy: { order: 'asc' } } },
      })
    )

    if (!checklist) throw new NotFoundError('Checklist')

    return createSuccessResponse(checklist, 'Checklist fetched successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/checklists/${id}`)
  }
}

// PATCH /api/checklists/[id] - Update a checklist
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(updateChecklistSchema, body)

    const updatedChecklist = await queryAsUser(userId, async (tx) => {
      const existing = await tx.checklist.findUnique({ where: { id, userId } })
      if (!existing) throw new NotFoundError('Checklist')

      return tx.checklist.update({
        where: { id },
        data: { title: validatedData.title, order: validatedData.order },
        include: { items: { orderBy: { order: 'asc' } } },
      })
    })

    return createSuccessResponse(updatedChecklist, 'Checklist updated successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/checklists/${id}`)
  }
}

// DELETE /api/checklists/[id] - Delete a checklist
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)

    await queryAsUser(userId, async (tx) => {
      const existing = await tx.checklist.findUnique({ where: { id, userId } })
      if (!existing) throw new NotFoundError('Checklist')

      await tx.checklist.delete({ where: { id } })

      const checklistsToReorder = await tx.checklist.findMany({
        where: { cardId: existing.cardId, order: { gt: existing.order } },
        orderBy: { order: 'asc' },
      })

      await Promise.all(
        checklistsToReorder.map(checklist =>
          tx.checklist.update({
            where: { id: checklist.id },
            data: { order: checklist.order - 1 },
          })
        )
      )
    })

    return createSuccessResponse(null, 'Checklist deleted successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/checklists/${id}`)
  }
}
