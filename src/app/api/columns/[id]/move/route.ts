import { NextRequest } from 'next/server'
import { moveColumnSchema } from '@/lib/validations/column'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError,
  ConflictError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'

// POST /api/columns/[id]/move - Move a column to a different board
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(moveColumnSchema, body)

    const movedColumn = await queryAsUser(userId, async (tx) => {
      const existingColumn = await tx.column.findUnique({
        where: { id: params.id, userId },
        include: { project: { select: { id: true, title: true } } },
      })
      if (!existingColumn) throw new NotFoundError('Column')

      const targetProject = await tx.project.findUnique({
        where: { id: validatedData.targetProjectId, userId },
        select: { id: true, title: true },
      })
      if (!targetProject) throw new NotFoundError('Target project')

      if (existingColumn.projectId === validatedData.targetProjectId) {
        throw new ConflictError('Cannot move column to the same project. Use reposition endpoint instead.')
      }

      const targetProjectColumnCount = await tx.column.count({
        where: { projectId: validatedData.targetProjectId },
      })

      if (validatedData.position > targetProjectColumnCount + 1) {
        throw new ConflictError(`Position must be between 1 and ${targetProjectColumnCount + 1}`)
      }

      const updatedColumn = await tx.column.update({
        where: { id: params.id },
        data: {
          projectId: validatedData.targetProjectId,
          order: validatedData.position - 1,
        },
        include: { project: { select: { id: true, title: true } } },
      })

      await tx.column.updateMany({
        where: {
          projectId: validatedData.targetProjectId,
          order: { gte: validatedData.position - 1 },
          id: { not: params.id },
        },
        data: { order: { increment: 1 } },
      })

      await tx.column.updateMany({
        where: {
          projectId: existingColumn.projectId,
          order: { gt: existingColumn.order },
        },
        data: { order: { decrement: 1 } },
      })

      await tx.card.updateMany({
        where: { columnId: params.id },
        data: { projectId: validatedData.targetProjectId },
      })

      return updatedColumn
    })

    return createSuccessResponse(movedColumn, 'Column moved successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${params.id}/move`)
  }
}
