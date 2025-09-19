import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { copyColumnSchema } from '@/lib/validations/column'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'

// POST /api/columns/[id]/copy - Copy a column with all nested data
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = validateRequestBody(copyColumnSchema, body)

    // Find the original column with all nested data
    const originalColumn = await prisma.column.findUnique({
      where: { id: validatedData.columnId },
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

    // Get the next order value (original order + 1)
    const nextOrder = originalColumn.order + 1

    // Use a transaction to ensure data consistency
    const copiedColumn = await prisma.$transaction(async (tx) => {
      // Create the new column
      const newColumn = await tx.column.create({
        data: {
          title: validatedData.title,
          order: nextOrder,
          projectId: originalColumn.projectId,
        },
      })

      // Update the order of columns that come after the original column
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
      const cardMapping = new Map<string, string>() // original card id -> new card id
      
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
          },
        })
        
        cardMapping.set(originalCard.id, newCard.id)

        // Copy all checklists for this card
        const checklistMapping = new Map<string, string>() // original checklist id -> new checklist id
        
        for (const originalChecklist of originalCard.checklists) {
          const newChecklist = await tx.checklist.create({
            data: {
              title: originalChecklist.title,
              order: originalChecklist.order,
              cardId: newCard.id,
            },
          })
          
          checklistMapping.set(originalChecklist.id, newChecklist.id)

          // Copy all checklist items for this checklist
          for (const originalItem of originalChecklist.items) {
            await tx.checklistItem.create({
              data: {
                text: originalItem.text,
                isCompleted: originalItem.isCompleted,
                order: originalItem.order,
                checklistId: newChecklist.id,
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
