
import {
  createSuccessResponse,
  handleAPIError,
  NotFoundError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { moveTaskSchema } from '@/lib/validations/task'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)

    const body = await request.json()
    const validatedData = validateRequestBody(moveTaskSchema, body)

    const existingTask = await prisma.card.findUnique({
      where: { id: validatedData.taskId, userId },
    })

    if (!existingTask) {
      throw new NotFoundError('Task')
    }

    await prisma.$transaction(
      validatedData.columns.flatMap(column =>
        column.cards.map(card =>
          prisma.card.update({
            where: { id: card.id },
            data: { columnId: column.id, order: card.order }
          })
        )
      )
    )

    const task = await prisma.card.findUnique({
      where: { id: validatedData.taskId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          }
        },
        column: {
          select: {
            id: true,
            title: true,
          }
        },
        cardLabels: {
          include: {
            label: true
          }
        }
      }
    })

    if (!task) {
      throw new NotFoundError('Task')
    }

    const taskWithLabels = {
      ...task,
      labels: task.cardLabels.map(cardLabel => ({
        id: cardLabel.label.id,
        title: cardLabel.label.title,
        color: cardLabel.label.color,
        projectId: cardLabel.label.projectId,
        createdAt: cardLabel.label.createdAt,
        updatedAt: cardLabel.label.updatedAt,
        checked: cardLabel.checked
      }))
    }

    return createSuccessResponse(taskWithLabels, 'Task updated successfully')
  } catch (error) {
    return handleAPIError(error, `/api/tasks/move`)
  }
}