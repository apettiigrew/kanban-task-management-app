import { createSuccessResponse, handleAPIError, NotFoundError } from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'
import { sortCardsSchema } from '@/lib/validations/column'
import { NextRequest } from 'next/server'

interface SortCardsRequest {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: SortCardsRequest) {
  const { id: columnId } = await params

  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = sortCardsSchema.parse(body)
    const { sortType } = validatedData

    const updatedColumn = await queryAsUser(userId, async (tx) => {
      const column = await tx.column.findUnique({
        where: { id: columnId, userId },
        include: { cards: { orderBy: { order: 'asc' } } },
      })
      if (!column) throw new NotFoundError('Column')

      const cards = column.cards
      if (cards.length < 2) return column

      const sortedCards = [...cards]
      switch (sortType) {
        case 'newest-first':
          sortedCards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          break
        case 'oldest-first':
          sortedCards.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          break
        case 'alphabetical':
          sortedCards.sort((a, b) => a.title.localeCompare(b.title))
          break
      }

      await Promise.all(
        sortedCards.map((card, index) =>
          tx.card.update({ where: { id: card.id }, data: { order: index } })
        )
      )

      return tx.column.findUnique({
        where: { id: columnId },
        include: { cards: { orderBy: { order: 'asc' } } },
      })
    })

    return createSuccessResponse(updatedColumn, 'Cards sorted successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${columnId}/sort`)
  }
}
