
import {
  createSuccessResponse,
  handleAPIError,
  NotFoundError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { prisma } from '@/lib/prisma'
import { moveTaskSchema } from '@/lib/validations/task'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest) {
  try {

    const body = await request.json()
    // Validate the request body using centralized validation
    const validatedData = validateRequestBody(moveTaskSchema, body)

    // Check if task exists
    const existingTask = await prisma.card.findUnique({
      where: { id: validatedData.taskId },
    })

    if (!existingTask) {
      throw new NotFoundError('Task')
    }

    console.log("validatedData", validatedData);
    // Update every cards that's in the two columns that change if they are one just update that column
    for (const column of validatedData.columns) {
      for (const card of column.cards) {
        await prisma.card.update({
          where: { id: card.id },
          data: { columnId: column.id, order: card.order }
        })
      }
    }

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
        }
      }
    })

    return createSuccessResponse(task, 'Task updated successfully')
  } catch (error) {
    console.log('error', error)
    return handleAPIError(error, `/api/tasks/move`)
  }
}