import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateChecklistItemSchema } from '@/lib/validations/checklist'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'

// GET /api/checklist-items/[id] - Get a specific checklist item
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }>}) {
  try {
    const { id } = await params

    const checklistItem = await prisma.checklistItem.findUnique({
      where: { id },
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
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }>}) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate the request body
    const validatedData = validateRequestBody(updateChecklistItemSchema, body)

    // Check if checklist item exists
    const existingItem = await prisma.checklistItem.findUnique({
      where: { id },
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
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }>}) {
  try {
    const { id } = await params

    // Check if checklist item exists
    const existingItem = await prisma.checklistItem.findUnique({
      where: { id },
    })

    if (!existingItem) {
      throw new NotFoundError('Checklist item')
    }

    // Delete the checklist item
    await prisma.checklistItem.delete({
      where: { id }
    })

    return createSuccessResponse(null, 'Checklist item deleted successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/checklist-items/${id}`)
  }
} 