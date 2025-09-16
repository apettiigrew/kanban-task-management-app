import { createSuccessResponse, handleAPIError, InternalServerError, NotFoundError, ValidationError } from '@/lib/api-error-handler'
import { prisma } from '@/lib/prisma'
import { sortCardsSchema } from '@/lib/validations/column'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

interface SortCardsRequest {
  params: { id: string }
}

export async function POST(request: NextRequest,{ params }: SortCardsRequest) {
  const columnId = params.id
  
  try {
    
    const body = await request.json()
    
    // Validate the request body
    const validatedData = sortCardsSchema.parse(body)
    const { sortType } = validatedData

    // Verify the column exists
    const column = await prisma.column.findUnique({
      where: {
        id: columnId
      },
      include: {
        cards: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!column) {
      return handleAPIError(new NotFoundError('Column not found'), `/api/columns/${columnId}/sort`)
    }

    // Get all cards in the column
    const cards = column.cards

    if (cards.length < 2) {
      // No need to sort if there are fewer than 2 cards
      return NextResponse.json(column)
    }

    // Sort cards based on sort type
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
      default:
        return NextResponse.json({ error: 'Invalid sort type' }, { status: 400 })
    }

    // Update the order of cards in the database using a transaction
    const updatedColumn = await prisma.$transaction(async (tx) => {
      // Update all cards in a single transaction
      const updatePromises = sortedCards.map((card, index) =>
        tx.card.update({
          where: { id: card.id },
          data: { order: index }
        })
      )

      await Promise.all(updatePromises)

      // Return the updated column with sorted cards
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
    console.error('Error sorting cards:', error)
    
    if (error instanceof z.ZodError) {  
      return handleAPIError(new ValidationError('Invalid request data', error), `/api/columns/${columnId}/sort`)
    }

    return handleAPIError(new InternalServerError('Internal server error'), `/api/columns/${columnId}/sort`)
  }
}
