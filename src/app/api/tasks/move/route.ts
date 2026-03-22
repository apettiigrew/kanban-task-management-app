import {
  createSuccessResponse,
  handleAPIError,
  NotFoundError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'
import { moveTaskSchema } from '@/lib/validations/task'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(moveTaskSchema, body)

    const task = await queryAsUser(userId, async (tx) => {
      const existingTask = await tx.card.findUnique({
        where: { id: validatedData.taskId, userId },
      })
      if (!existingTask) throw new NotFoundError('Task')

      await Promise.all(
        validatedData.columns.flatMap(column =>
          column.cards.map(card =>
            tx.card.update({
              where: { id: card.id },
              data: { columnId: column.id, order: card.order },
            })
          )
        )
      )

      const updated = await tx.card.findUnique({
        where: { id: validatedData.taskId },
        include: {
          project: { select: { id: true, title: true } },
          column: { select: { id: true, title: true } },
          cardLabels: { include: { label: true } },
        },
      })
      if (!updated) throw new NotFoundError('Task')

      return updated
    })

    const taskWithLabels = {
      ...task,
      labels: task.cardLabels.map(cardLabel => ({
        id: cardLabel.label.id,
        title: cardLabel.label.title,
        color: cardLabel.label.color,
        projectId: cardLabel.label.projectId,
        createdAt: cardLabel.label.createdAt,
        updatedAt: cardLabel.label.updatedAt,
        checked: cardLabel.checked,
      })),
    }

    return createSuccessResponse(taskWithLabels, 'Task updated successfully')
  } catch (error) {
    return handleAPIError(error, '/api/tasks/move')
  }
}
