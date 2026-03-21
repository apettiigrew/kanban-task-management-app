import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateChecklistSchema } from '@/lib/validations/checklist'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'

// GET /api/checklists/[id] - Get a specific checklist
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)

    const checklist = await prisma.checklist.findUnique({
      where: { id, userId },
      include: {
        items: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    if (!checklist) {
      throw new NotFoundError('Checklist')
    }

    return createSuccessResponse(checklist, 'Checklist fetched successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/checklists/${id}`)
  }
}

// PATCH /api/checklists/[id] - Update a checklist
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    
    const validatedData = validateRequestBody(updateChecklistSchema, body)

    // Check if checklist exists and belongs to the authenticated user
    const existingChecklist = await prisma.checklist.findUnique({
      where: { id, userId },
    })

    if (!existingChecklist) {
      throw new NotFoundError('Checklist')
    }

    const updatedChecklist = await prisma.checklist.update({
      where: { id },
      data: {
        title: validatedData.title,
        order: validatedData.order,
      },
      include: {
        items: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return createSuccessResponse(updatedChecklist, 'Checklist updated successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/checklists/${id}`)
  }
}

// DELETE /api/checklists/[id] - Delete a checklist
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)

    // Check if checklist exists and belongs to the authenticated user
    const existingChecklist = await prisma.checklist.findUnique({
      where: { id, userId },
    })

    if (!existingChecklist) {
      throw new NotFoundError('Checklist')
    }

    await prisma.$transaction(async (tx) => {
      await tx.checklist.delete({
        where: { id }
      })

      // Find remaining checklists that come after the deleted one
      const checklistsToReorder = await tx.checklist.findMany({
        where: {
          cardId: existingChecklist.cardId,
          order: {
            gt: existingChecklist.order
          }
        },
        orderBy: {
          order: 'asc'
        }
      })

      // Fill the gap by decrementing each subsequent checklist's order by 1
      const updatePromises = checklistsToReorder.map((checklist) =>
        tx.checklist.update({
          where: { id: checklist.id },
          data: { order: checklist.order - 1 }
        })
      )

      await Promise.all(updatePromises)
    })

    return createSuccessResponse(null, 'Checklist deleted successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/checklists/${id}`)
  }
}
