import { NextRequest } from 'next/server'
import { createChecklistItemSchema } from '@/lib/validations/checklist'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'

// GET /api/checklist-items - Get checklist items (optionally filtered by checklist)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const checklistId = searchParams.get('checklistId')

    const whereClause = checklistId ? { checklistId, userId } : { userId }

    const items = await queryAsUser(userId, (tx) =>
      tx.checklistItem.findMany({
        where: whereClause,
        orderBy: { order: 'asc' },
      })
    )

    return createSuccessResponse(items, 'Checklist items fetched successfully')
  } catch (error) {
    return handleAPIError(error, '/api/checklist-items')
  }
}

// POST /api/checklist-items - Create a new checklist item
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(createChecklistItemSchema, body)

    const checklistItem = await queryAsUser(userId, async (tx) => {
      const checklist = await tx.checklist.findUnique({
        where: { id: validatedData.checklistId, userId },
      })
      if (!checklist) throw new NotFoundError('Checklist')

      const maxOrder = await tx.checklistItem.findFirst({
        where: { checklistId: validatedData.checklistId },
        orderBy: { order: 'desc' },
        select: { order: true },
      })

      const newOrder = validatedData.order !== 0
        ? validatedData.order
        : (maxOrder?.order ?? -1) + 1

      return tx.checklistItem.create({
        data: { ...validatedData, order: newOrder, userId },
      })
    })

    return createSuccessResponse(checklistItem, 'Checklist item created successfully', 201)
  } catch (error) {
    return handleAPIError(error, '/api/checklist-items')
  }
}
