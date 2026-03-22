import { NextRequest } from 'next/server'
import { updateTaskSchema } from '@/lib/validations/task'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'

// GET /api/tasks/[id] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const userId = getUserIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const includeRelations = searchParams.get('includeRelations') === 'true'

    const task = await queryAsUser(userId, (tx) =>
      tx.card.findUnique({
        where: { id, userId },
        include: {
          project: includeRelations ? { select: { id: true, title: true } } : false,
          column: includeRelations ? { select: { id: true, title: true } } : false,
          cardLabels: { include: { label: true } },
        },
      })
    )

    if (!task) throw new NotFoundError('Task')

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

    return createSuccessResponse(taskWithLabels, 'Task fetched successfully')
  } catch (error) {
    return handleAPIError(error, `/api/tasks/${id}`)
  }
}

// PUT /api/tasks/[id] - Update a specific task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(updateTaskSchema, body)

    const task = await queryAsUser(userId, async (tx) => {
      const existing = await tx.card.findUnique({ where: { id, userId } })
      if (!existing) throw new NotFoundError('Task')

      return tx.card.update({
        where: { id },
        data: validatedData,
        include: {
          project: { select: { id: true, title: true } },
          column: { select: { id: true, title: true } },
          cardLabels: { include: { label: true } },
        },
      })
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
    return handleAPIError(error, `/api/tasks/${id}`)
  }
}

// DELETE /api/tasks/[id] - Delete a specific task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const userId = getUserIdFromRequest(request)

    await queryAsUser(userId, async (tx) => {
      const existing = await tx.card.findUnique({ where: { id, userId } })
      if (!existing) throw new NotFoundError('Task')

      await tx.card.delete({ where: { id } })
    })

    return createSuccessResponse(null, 'Task deleted successfully')
  } catch (error) {
    return handleAPIError(error, `/api/tasks/${id}`)
  }
}
