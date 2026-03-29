import { NextRequest } from 'next/server'
import { updateColumnSchema } from '@/lib/validations/column'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'

// GET /api/columns/[id] - Get a specific column
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const userId = getUserIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const includeTasks = searchParams.get('includeTasks') === 'true'

    const column = await queryAsUser(userId, (tx) =>
      tx.column.findUnique({
        where: { id, userId },
        include: {
          cards: includeTasks,
          project: { select: { id: true, title: true } },
        },
      })
    )

    if (!column) throw new NotFoundError('Column')

    return createSuccessResponse(column, 'Column fetched successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${id}`)
  }
}

// PUT /api/columns/[id] - Update a specific column
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(updateColumnSchema, body)

    const column = await queryAsUser(userId, async (tx) => {
      const existing = await tx.column.findUnique({ where: { id, userId } })
      if (!existing) throw new NotFoundError('Column')

      return tx.column.update({
        where: { id },
        data: { title: validatedData.title },
        include: { project: { select: { id: true, title: true } } },
      })
    })

    return createSuccessResponse(column, 'Column updated successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${id}`)
  }
}

// DELETE /api/columns/[id] - Delete a specific column
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const userId = getUserIdFromRequest(request)

    await queryAsUser(userId, async (tx) => {
      const existing = await tx.column.findUnique({
        where: { id, userId },
        include: { _count: { select: { cards: true } } },
      })
      if (!existing) throw new NotFoundError('Column')

      await tx.card.deleteMany({ where: { columnId: id } })
      await tx.column.delete({ where: { id } })

      const remainingColumns = await tx.column.findMany({
        where: { projectId: existing.projectId },
        orderBy: { order: 'asc' },
      })

      await Promise.all(
        remainingColumns.map((column, index) =>
          tx.column.update({
            where: { id: column.id },
            data: { order: index },
          }),
        ),
      )
    })

    return createSuccessResponse(undefined, 'Column deleted successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${id}`)
  }
}
