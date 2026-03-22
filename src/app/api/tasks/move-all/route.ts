import {
  createSuccessResponse,
  handleAPIError,
  NotFoundError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'
import { moveAllCardsSchema } from '@/lib/validations/task'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(moveAllCardsSchema, body)

    const result = await queryAsUser(userId, async (tx) => {
      const sourceColumn = await tx.column.findUnique({
        where: {
          id: validatedData.sourceColumnId,
          projectId: validatedData.projectId,
          project: { userId },
        },
        include: { cards: { orderBy: { order: 'asc' } } },
      })
      if (!sourceColumn) throw new NotFoundError('Source column')

      const targetColumn = await tx.column.findUnique({
        where: {
          id: validatedData.targetColumnId,
          projectId: validatedData.projectId,
          project: { userId },
        },
      })
      if (!targetColumn) throw new NotFoundError('Target column')

      if (validatedData.sourceColumnId === validatedData.targetColumnId) {
        throw new Error('Cannot move cards to the same column')
      }

      if (sourceColumn.cards.length === 0) {
        return {
          movedCount: 0,
          sourceColumnId: validatedData.sourceColumnId,
          targetColumnId: validatedData.targetColumnId,
          movedCards: [],
        }
      }

      const lastCardInTarget = await tx.card.findFirst({
        where: {
          columnId: validatedData.targetColumnId,
          projectId: validatedData.projectId,
          userId,
        },
        orderBy: { order: 'desc' },
        select: { order: true },
      })

      const startingOrder = lastCardInTarget ? lastCardInTarget.order + 1 : 0

      await Promise.all(
        sourceColumn.cards.map((card, index) =>
          tx.card.update({
            where: { id: card.id },
            data: { columnId: validatedData.targetColumnId, order: startingOrder + index },
          })
        )
      )

      const movedCards = await tx.card.findMany({
        where: { id: { in: sourceColumn.cards.map(card => card.id) } },
        include: {
          project: { select: { id: true, title: true } },
          column: { select: { id: true, title: true } },
        },
        orderBy: { order: 'asc' },
      })

      return {
        movedCount: movedCards.length,
        sourceColumnId: validatedData.sourceColumnId,
        targetColumnId: validatedData.targetColumnId,
        movedCards,
      }
    })

    return createSuccessResponse(
      result,
      `Successfully moved ${result.movedCount} card${result.movedCount === 1 ? '' : 's'}`
    )
  } catch (error) {
    return handleAPIError(error, '/api/tasks/move-all')
  }
}
