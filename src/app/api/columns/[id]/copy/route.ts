import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { copyColumnSchema } from '@/lib/validations/column'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'

// POST /api/columns/[id]/copy - Copy a column with all nested data
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    
    const validatedData = validateRequestBody(copyColumnSchema, body)

    // Find the original column and verify it belongs to the authenticated user
    const originalColumn = await prisma.column.findUnique({
      where: { id: validatedData.columnId, userId },
      include: {
        cards: {
          include: {
            checklists: {
              include: {
                items: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        project: {
          select: {
            id: true,
            title: true,
          }
        }
      },
    })

    if (!originalColumn) {
      throw new NotFoundError('Column')
    }

    const nextOrder = originalColumn.order + 1

    const copiedColumn = await prisma.$transaction(async (tx) => {
      // Create the new column with userId
      const newColumn = await tx.column.create({
        data: {
          title: validatedData.title,
          order: nextOrder,
          projectId: originalColumn.projectId,
          userId,
        },
      })

      // Shift orders of columns after the original to make room
      await tx.column.updateMany({
        where: {
          projectId: originalColumn.projectId,
          order: {
            gte: nextOrder,
          },
          id: {
            not: newColumn.id,
          },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      })

      // Copy all cards from the original column
      for (const originalCard of originalColumn.cards) {
        const newCard = await tx.card.create({
          data: {
            title: originalCard.title,
            description: originalCard.description,
            order: originalCard.order,
            labels: originalCard.labels,
            dueDate: originalCard.dueDate,
            projectId: originalColumn.projectId,
            columnId: newColumn.id,
            userId,
          },
        })

        // Copy all checklists for this card
        for (const originalChecklist of originalCard.checklists) {
          const newChecklist = await tx.checklist.create({
            data: {
              title: originalChecklist.title,
              order: originalChecklist.order,
              cardId: newCard.id,
              userId,
            },
          })

          // Copy all checklist items for this checklist
          for (const originalItem of originalChecklist.items) {
            await tx.checklistItem.create({
              data: {
                text: originalItem.text,
                isCompleted: originalItem.isCompleted,
                order: originalItem.order,
                checklistId: newChecklist.id,
                userId,
              },
            })
          }
        }
      }

      // Return the new column with all nested data
      return await tx.column.findUnique({
        where: { id: newColumn.id },
        include: {
          cards: {
            include: {
              checklists: {
                include: {
                  items: true
                }
              }
            },
            orderBy: {
              order: 'asc'
            }
          },
          project: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      })
    })

    return createSuccessResponse(copiedColumn, 'Column copied successfully', 201)
  } catch (error) {
    return handleAPIError(error, `/api/columns/${params.id}/copy`)
  }
}
