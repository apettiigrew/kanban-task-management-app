import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateChecklistItemSchema } from '@/lib/validations/checklist'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'

// GET /api/checklist-items/[id] - Get a specific checklist item
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)

    const checklistItem = await prisma.checklistItem.findUnique({
      where: { id, userId },
    })

    if (!checklistItem) {
      throw new NotFoundError('Checklist item')
    }

    return createSuccessResponse(checklistItem, 'Checklist item fetched successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/checklist-items/${id}`)
  }
}

// PATCH /api/checklist-items/[id] - Update a checklist item
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    
    const validatedData = validateRequestBody(updateChecklistItemSchema, body)

    // Check if checklist item exists and belongs to the authenticated user
    const existingItem = await prisma.checklistItem.findUnique({
      where: { id, userId },
    })

    if (!existingItem) {
      throw new NotFoundError('Checklist item')
    }

    const updatedItem = await prisma.checklistItem.update({
      where: { id },
      data: {
        text: validatedData.text,
        isCompleted: validatedData.isCompleted,
        order: validatedData.order,
      }
    })

    return createSuccessResponse(updatedItem, 'Checklist item updated successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/checklist-items/${id}`)
  }
}

// DELETE /api/checklist-items/[id] - Delete a checklist item
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)

    // Check if checklist item exists and belongs to the authenticated user
    const existingItem = await prisma.checklistItem.findUnique({
      where: { id, userId },
    })

    if (!existingItem) {
      throw new NotFoundError('Checklist item')
    }

    await prisma.checklistItem.delete({
      where: { id }
    })

    return createSuccessResponse(null, 'Checklist item deleted successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/checklist-items/${id}`)
  }
}
