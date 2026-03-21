import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateLabelSchema } from '@/lib/validations/label'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody,
  NotFoundError 
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { TLabel } from '@/models/label'

// GET /api/labels/[id] - Get a specific label
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)
    
    const label = await prisma.label.findUnique({
      where: { id, userId }
    })

    if (!label) {
      throw new NotFoundError('Label')
    }

    const response: TLabel = label

    return createSuccessResponse(response, 'Label fetched successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/labels/${id}`)
  }
}

// PATCH /api/labels/[id] - Update a label (mainly for checking/unchecking)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(updateLabelSchema, body)

    const existingLabel = await prisma.label.findUnique({
      where: { id, userId }
    })

    if (!existingLabel) {
      throw new NotFoundError('Label')
    }

    const label = await prisma.label.update({
      where: { id },
      data: validatedData
    })

    const response: TLabel = label

    return createSuccessResponse(response, 'Label updated successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/labels/${id}`)
  }
}

// DELETE /api/labels/[id] - Delete a label
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)

    const existingLabel = await prisma.label.findUnique({
      where: { id, userId }
    })

    if (!existingLabel) {
      throw new NotFoundError('Label')
    }

    await prisma.label.delete({
      where: { id }
    })

    return createSuccessResponse(null, 'Label deleted successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/labels/${id}`)
  }
}
