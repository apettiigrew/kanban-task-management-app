import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateTaskSchema } from '@/lib/validations/task'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  checkRateLimit,
  NotFoundError
} from '@/lib/api-error-handler'

// GET /api/tasks/[id] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {


    const { searchParams } = new URL(request.url)
    const includeRelations = searchParams.get('includeRelations') === 'true'

    const task = await prisma.card.findUnique({
      where: { id: params.id },
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
      },
    })

    if (!task) {
      throw new NotFoundError('Task')
    }

    return createSuccessResponse(task, 'Task fetched successfully')
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
  
    const body = await request.json()
    // Validate the request body using centralized validation
    const validatedData = validateRequestBody(updateTaskSchema, body)

    // Check if task exists
    const existingTask = await prisma.card.findUnique({
      where: { id: params.id },
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
        }
      }
    })

    return createSuccessResponse(task, 'Task updated successfully')
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

    const existingTask = await prisma.card.findUnique({
      where: { id: params.id },
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
