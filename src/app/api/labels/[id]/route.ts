import { NextRequest } from 'next/server'
import { updateLabelSchema } from '@/lib/validations/label'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'
import { TLabel } from '@/models/label'

// GET /api/labels/[id] - Get a specific label
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)

    const label = await queryAsUser(userId, (tx) =>
      tx.label.findUnique({ where: { id, userId } })
    )

    if (!label) throw new NotFoundError('Label')

    const response: TLabel = label

    return createSuccessResponse(response, 'Label fetched successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/labels/${id}`)
  }
}

// PATCH /api/labels/[id] - Update a label
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(updateLabelSchema, body)

    const label = await queryAsUser(userId, async (tx) => {
      const existing = await tx.label.findUnique({ where: { id, userId } })
      if (!existing) throw new NotFoundError('Label')

      return tx.label.update({ where: { id }, data: validatedData })
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

    await queryAsUser(userId, async (tx) => {
      const existing = await tx.label.findUnique({ where: { id, userId } })
      if (!existing) throw new NotFoundError('Label')

      await tx.label.delete({ where: { id } })
    })

    return createSuccessResponse(null, 'Label deleted successfully')
  } catch (error) {
    const { id } = await params
    return handleAPIError(error, `/api/labels/${id}`)
  }
}
