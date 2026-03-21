import { createSuccessResponse, handleAPIError, NotFoundError } from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { sortCardsSchema } from '@/lib/validations/column'
import { NextRequest } from 'next/server'

interface SortCardsRequest {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: SortCardsRequest) {
  const columnId = params.id
  
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    
    const validatedData = sortCardsSchema.parse(body)
    const { sortType } = validatedData

    // Verify the column exists and belongs to the authenticated user
    const column = await prisma.column.findUnique({
      where: { id: columnId, userId },
      include: {
        cards: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!column) {
      throw new NotFoundError('Column')
    }

    const cards = column.cards

    if (cards.length < 2) {
      return createSuccessResponse(column, 'No sorting needed')
    }

    let sortedCards = [...cards]
    
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

    const updatedColumn = await prisma.$transaction(async (tx) => {
      const updatePromises = sortedCards.map((card, index) =>
        tx.card.update({
          where: { id: card.id },
          data: { order: index }
        })
      )

      await Promise.all(updatePromises)

      return await tx.column.findUnique({
        where: { id: columnId },
        include: {
          cards: {
            orderBy: { order: 'asc' }
          }
        }
      })
    })

    return createSuccessResponse(updatedColumn, 'Cards sorted successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${columnId}/sort`)
  }
}
