import { NextRequest } from 'next/server'
import { repositionColumnSchema } from '@/lib/validations/column'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError,
  ConflictError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'

// PUT /api/columns/[id]/reposition - Reposition a column within the same board
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(repositionColumnSchema, body)

    const repositionedColumn = await queryAsUser(userId, async (tx) => {
      const existingColumn = await tx.column.findUnique({
        where: { id: params.id, userId },
        include: { project: { select: { id: true, title: true } } },
      })
      if (!existingColumn) throw new NotFoundError('Column')

      const projectColumnCount = await tx.column.count({
        where: { projectId: existingColumn.projectId },
      })

      if (validatedData.position < 1 || validatedData.position > projectColumnCount) {
        throw new ConflictError(`Position must be between 1 and ${projectColumnCount}`)
      }

      const newPosition = validatedData.position - 1
      const currentPosition = existingColumn.order

      if (newPosition === currentPosition) {
        return existingColumn
      }

      const updatedColumn = await tx.column.update({
        where: { id: params.id },
        data: { order: newPosition },
        include: { project: { select: { id: true, title: true } } },
      })

      if (newPosition < currentPosition) {
        await tx.column.updateMany({
          where: {
            projectId: existingColumn.projectId,
            order: { gte: newPosition, lt: currentPosition },
            id: { not: params.id },
          },
          data: { order: { increment: 1 } },
        })
      } else {
        await tx.column.updateMany({
          where: {
            projectId: existingColumn.projectId,
            order: { gt: currentPosition, lte: newPosition },
            id: { not: params.id },
          },
          data: { order: { decrement: 1 } },
        })
      }

      return updatedColumn
    })

    return createSuccessResponse(repositionedColumn, 'Column repositioned successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${params.id}/reposition`)
  }
}
