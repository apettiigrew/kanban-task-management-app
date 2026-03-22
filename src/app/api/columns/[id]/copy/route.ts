import { NextRequest } from 'next/server'
import { copyColumnSchema } from '@/lib/validations/column'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'

// POST /api/columns/[id]/copy - Copy a column with all nested data
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(copyColumnSchema, body)

    const copiedColumn = await queryAsUser(userId, async (tx) => {
      const originalColumn = await tx.column.findUnique({
        where: { id: validatedData.columnId, userId },
        include: {
          cards: {
            include: { checklists: { include: { items: true } } },
            orderBy: { order: 'asc' },
          },
          project: { select: { id: true, title: true } },
        },
      })
      if (!originalColumn) throw new NotFoundError('Column')

      const nextOrder = originalColumn.order + 1

      const newColumn = await tx.column.create({
        data: {
          title: validatedData.title,
          order: nextOrder,
          projectId: originalColumn.projectId,
          userId,
        },
      })

      await tx.column.updateMany({
        where: {
          projectId: originalColumn.projectId,
          order: { gte: nextOrder },
          id: { not: newColumn.id },
        },
        data: { order: { increment: 1 } },
      })

      for (const originalCard of originalColumn.cards) {
        const newCard = await tx.card.create({
          data: {
            title: originalCard.title,
            description: originalCard.description,
            order: originalCard.order,
            labels: originalCard.labels,
            dueDate: originalCard.dueDate,
            projectId: originalColumn.projectId,
            columnId: newColumn.id,
            userId,
          },
        })

        for (const originalChecklist of originalCard.checklists) {
          const newChecklist = await tx.checklist.create({
            data: {
              title: originalChecklist.title,
              order: originalChecklist.order,
              cardId: newCard.id,
              userId,
            },
          })

          for (const originalItem of originalChecklist.items) {
            await tx.checklistItem.create({
              data: {
                text: originalItem.text,
                isCompleted: originalItem.isCompleted,
                order: originalItem.order,
                checklistId: newChecklist.id,
                userId,
              },
            })
          }
        }
      }

      return tx.column.findUnique({
        where: { id: newColumn.id },
        include: {
          cards: {
            include: { checklists: { include: { items: true } } },
            orderBy: { order: 'asc' },
          },
          project: { select: { id: true, title: true } },
        },
      })
    })

    return createSuccessResponse(copiedColumn, 'Column copied successfully', 201)
  } catch (error) {
    return handleAPIError(error, `/api/columns/${id}/copy`)
  }
}
