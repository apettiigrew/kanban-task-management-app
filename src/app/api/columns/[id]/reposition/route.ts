import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { repositionColumnSchema } from '@/lib/validations/column'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError,
  ConflictError
} from '@/lib/api-error-handler'

// PUT /api/columns/[id]/reposition - Reposition a column within the same board
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = validateRequestBody(repositionColumnSchema, body)

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

    // Get the total number of columns in the current project
    const projectColumnCount = await prisma.column.count({
      where: { projectId: existingColumn.projectId }
    })

    // Validate position is within valid range
    if (validatedData.position < 1 || validatedData.position > projectColumnCount) {
      throw new ConflictError(`Position must be between 1 and ${projectColumnCount}`)
    }

    // Convert to 0-based index
    const newPosition = validatedData.position - 1
    const currentPosition = existingColumn.order

    // If the position hasn't changed, return the column as-is
    if (newPosition === currentPosition) {
      return createSuccessResponse(existingColumn, 'Column position unchanged')
    }

    // Use a transaction to ensure data consistency
    const repositionedColumn = await prisma.$transaction(async (tx) => {
      // Update the column's order
      const updatedColumn = await tx.column.update({
        where: { id: params.id },
        data: {
          order: newPosition,
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

      if (newPosition < currentPosition) {
        // Moving column to an earlier position (left)
        // Increment order of columns that are now after the moved column
        await tx.column.updateMany({
          where: {
            projectId: existingColumn.projectId,
            order: {
              gte: newPosition,
              lt: currentPosition,
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
      } else {
        // Moving column to a later position (right)
        // Decrement order of columns that are now before the moved column
        await tx.column.updateMany({
          where: {
            projectId: existingColumn.projectId,
            order: {
              gt: currentPosition,
              lte: newPosition,
            },
            id: {
              not: params.id, // Don't update the moved column itself
            },
          },
          data: {
            order: {
              decrement: 1,
            },
          },
        })
      }

      return updatedColumn
    })

    return createSuccessResponse(repositionedColumn, 'Column repositioned successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${params.id}/reposition`)
  }
}
