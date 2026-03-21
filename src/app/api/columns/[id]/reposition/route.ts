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
import { getUserIdFromRequest } from '@/lib/auth-helpers'

// PUT /api/columns/[id]/reposition - Reposition a column within the same board
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    
    const validatedData = validateRequestBody(repositionColumnSchema, body)

    // Verify the column exists and belongs to the authenticated user
    const existingColumn = await prisma.column.findUnique({
      where: { id: params.id, userId },
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

    const projectColumnCount = await prisma.column.count({
      where: { projectId: existingColumn.projectId }
    })

    if (validatedData.position < 1 || validatedData.position > projectColumnCount) {
      throw new ConflictError(`Position must be between 1 and ${projectColumnCount}`)
    }

    const newPosition = validatedData.position - 1
    const currentPosition = existingColumn.order

    if (newPosition === currentPosition) {
      return createSuccessResponse(existingColumn, 'Column position unchanged')
    }

    const repositionedColumn = await prisma.$transaction(async (tx) => {
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
        // Moving left: increment order of columns between new and old positions
        await tx.column.updateMany({
          where: {
            projectId: existingColumn.projectId,
            order: {
              gte: newPosition,
              lt: currentPosition,
            },
            id: {
              not: params.id,
            },
          },
          data: {
            order: {
              increment: 1,
            },
          },
        })
      } else {
        // Moving right: decrement order of columns between old and new positions
        await tx.column.updateMany({
          where: {
            projectId: existingColumn.projectId,
            order: {
              gt: currentPosition,
              lte: newPosition,
            },
            id: {
              not: params.id,
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
