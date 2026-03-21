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
import { getUserIdFromRequest } from '@/lib/auth-helpers'

// POST /api/columns/[id]/move - Move a column to a different board
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    
    const validatedData = validateRequestBody(moveColumnSchema, body)

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

    // Verify the target project exists and belongs to the authenticated user
    const targetProject = await prisma.project.findUnique({
      where: { id: validatedData.targetProjectId, userId },
      select: {
        id: true,
        title: true,
      }
    })

    if (!targetProject) {
      throw new NotFoundError('Target project')
    }

    if (existingColumn.projectId === validatedData.targetProjectId) {
      throw new ConflictError('Cannot move column to the same project. Use reposition endpoint instead.')
    }

    const targetProjectColumnCount = await prisma.column.count({
      where: { projectId: validatedData.targetProjectId }
    })

    if (validatedData.position > targetProjectColumnCount + 1) {
      throw new ConflictError(`Position must be between 1 and ${targetProjectColumnCount + 1}`)
    }

    const movedColumn = await prisma.$transaction(async (tx) => {
      const updatedColumn = await tx.column.update({
        where: { id: params.id },
        data: {
          projectId: validatedData.targetProjectId,
          order: validatedData.position - 1,
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

      // Shift columns in target project to make room
      await tx.column.updateMany({
        where: {
          projectId: validatedData.targetProjectId,
          order: {
            gte: validatedData.position - 1,
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

      // Close the gap in the source project
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

      // Reassign cards to the new project
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
