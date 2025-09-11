import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { moveColumnSchema } from '@/lib/validations/column'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError,
  ConflictError
} from '@/lib/api-error-handler'

// POST /api/columns/[id]/move - Move a column to a different board
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = validateRequestBody(moveColumnSchema, body)

    // Verify the column exists and get its current data
    const existingColumn = await prisma.column.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    if (!existingColumn) {
      throw new NotFoundError('Column')
    }

    // Verify the target project exists
    const targetProject = await prisma.project.findUnique({
      where: { id: validatedData.targetProjectId },
      select: {
        id: true,
        title: true,
      }
    })

    if (!targetProject) {
      throw new NotFoundError('Target project')
    }

    // Check if moving to the same project
    if (existingColumn.projectId === validatedData.targetProjectId) {
      throw new ConflictError('Cannot move column to the same project. Use reposition endpoint instead.')
    }

    // Get the total number of columns in the target project
    const targetProjectColumnCount = await prisma.column.count({
      where: { projectId: validatedData.targetProjectId }
    })

    // Validate position is within valid range
    if (validatedData.position > targetProjectColumnCount + 1) {
      throw new ConflictError(`Position must be between 1 and ${targetProjectColumnCount + 1}`)
    }

    // Use a transaction to ensure data consistency
    const movedColumn = await prisma.$transaction(async (tx) => {
      // Update the column's projectId and order
      const updatedColumn = await tx.column.update({
        where: { id: params.id },
        data: {
          projectId: validatedData.targetProjectId,
          order: validatedData.position - 1, // Convert to 0-based index
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      })

      // Update the order of columns in the target project that come after the new position
      await tx.column.updateMany({
        where: {
          projectId: validatedData.targetProjectId,
          order: {
            gte: validatedData.position - 1, // Convert to 0-based index
          },
          id: {
            not: params.id, // Don't update the moved column itself
          },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      })

      // Update the order of columns in the source project that come after the original position
      await tx.column.updateMany({
        where: {
          projectId: existingColumn.projectId,
          order: {
            gt: existingColumn.order,
          },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      })

      // Update all cards in the moved column to have the new projectId
      await tx.card.updateMany({
        where: {
          columnId: params.id,
        },
        data: {
          projectId: validatedData.targetProjectId,
        },
      })

      return updatedColumn
    })

    return createSuccessResponse(movedColumn, 'Column moved successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${params.id}/move`)
  }
}
