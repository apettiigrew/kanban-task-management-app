import {
  createSuccessResponse,
  handleAPIError,
  NotFoundError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { prisma } from '@/lib/prisma'
import { moveAllCardsSchema } from '@/lib/validations/task'
import { NextRequest } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = validateRequestBody(moveAllCardsSchema, body)

    // Check if source column exists
    const sourceColumn = await prisma.column.findUnique({
      where: { 
        id: validatedData.sourceColumnId,
        projectId: validatedData.projectId 
      },
      include: {
        cards: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!sourceColumn) {
      throw new NotFoundError('Source column')
    }

    // Check if target column exists
    const targetColumn = await prisma.column.findUnique({
      where: { 
        id: validatedData.targetColumnId,
        projectId: validatedData.projectId 
      }
    })

    if (!targetColumn) {
      throw new NotFoundError('Target column')
    }

    // Prevent moving to the same column
    if (validatedData.sourceColumnId === validatedData.targetColumnId) {
      throw new Error('Cannot move cards to the same column')
    }

    // If no cards to move, return early
    if (sourceColumn.cards.length === 0) {
      return createSuccessResponse(
        { movedCount: 0, sourceColumnId: validatedData.sourceColumnId, targetColumnId: validatedData.targetColumnId },
        'No cards to move'
      )
    }

    // Get the highest order in the target column
    const lastCardInTarget = await prisma.card.findFirst({
      where: {
        columnId: validatedData.targetColumnId,
        projectId: validatedData.projectId,
      },
      orderBy: {
        order: 'desc'
      },
      select: {
        order: true
      }
    })

    const startingOrder = lastCardInTarget ? lastCardInTarget.order + 1 : 0

    // Use transaction to move all cards atomically
    const result = await prisma.$transaction(async (tx) => {
      // Update all cards from source column to target column
      const updatePromises = sourceColumn.cards.map((card, index) =>
        tx.card.update({
          where: { id: card.id },
          data: {
            columnId: validatedData.targetColumnId,
            order: startingOrder + index
          }
        })
      )

      await Promise.all(updatePromises)

      // Return the updated cards with their new positions
      return await tx.card.findMany({
        where: {
          id: { in: sourceColumn.cards.map(card => card.id) }
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
            }
          },
          column: {
            select: {
              id: true,
              title: true,
            }
          }
        },
        orderBy: { order: 'asc' }
      })
    })

    return createSuccessResponse(
      { 
        movedCount: result.length,
        sourceColumnId: validatedData.sourceColumnId,
        targetColumnId: validatedData.targetColumnId,
        movedCards: result
      },
      `Successfully moved ${result.length} card${result.length === 1 ? '' : 's'}`
    )
  } catch (error) {
    return handleAPIError(error, '/api/tasks/move-all')
  }
}
