import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateTaskSchema } from '@/lib/validations/task'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'

// GET /api/tasks/[id] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)

    const { searchParams } = new URL(request.url)
    const includeRelations = searchParams.get('includeRelations') === 'true'

    const task = await prisma.card.findUnique({
      where: { id: params.id, userId },
      include: {
        project: includeRelations ? {
          select: {
            id: true,
            title: true,
          }
        } : false,
        column: includeRelations ? {
          select: {
            id: true,
            title: true,
          }
        } : false,
        cardLabels: {
          include: {
            label: true
          }
        }
      },
    })

    if (!task) {
      throw new NotFoundError('Task')
    }

    // Transform the data to include labels with checked status
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

    return createSuccessResponse(taskWithLabels, 'Task fetched successfully')
  } catch (error) {
    return handleAPIError(error, `/api/tasks/${params.id}`)
  }
}

// PUT /api/tasks/[id] - Update a specific task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)

    const body = await request.json()
    const validatedData = validateRequestBody(updateTaskSchema, body)

    const existingTask = await prisma.card.findUnique({
      where: { id: params.id, userId },
    })

    if (!existingTask) {
      throw new NotFoundError('Task')
    }

    const task = await prisma.card.update({
      where: { id: params.id },
      data: validatedData,
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

    // Transform the data to include labels with checked status
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
    return handleAPIError(error, `/api/tasks/${params.id}`)
  }
}

// DELETE /api/tasks/[id] - Delete a specific task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)

    const existingTask = await prisma.card.findUnique({
      where: { id: params.id, userId },
    })

    if (!existingTask) {
      throw new NotFoundError('Task')
    }

    // Delete the task
    await prisma.card.delete({
      where: { id: params.id },
    })

    return createSuccessResponse(null, 'Task deleted successfully')
  } catch (error) {
    return handleAPIError(error, `/api/tasks/${params.id}`)
  }
}
