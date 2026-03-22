import { NextRequest } from 'next/server'
import { createChecklistSchema } from '@/lib/validations/checklist'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'
import { TChecklist } from '@/models/checklist'

// GET /api/checklists - Get checklists (optionally filtered by card)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('cardId')

    const whereClause = cardId ? { cardId, userId } : { userId }

    const checklists = await queryAsUser(userId, (tx) =>
      tx.checklist.findMany({
        where: whereClause,
        include: { items: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      })
    )

    const response: TChecklist[] = checklists

    return createSuccessResponse(response, 'Checklists fetched successfully')
  } catch (error) {
    return handleAPIError(error, '/api/checklists')
  }
}

// POST /api/checklists - Create a new checklist
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(createChecklistSchema, body)

    const checklist = await queryAsUser(userId, async (tx) => {
      const card = await tx.card.findUnique({
        where: { id: validatedData.cardId, userId },
      })
      if (!card) throw new NotFoundError('Card')

      const maxOrder = await tx.checklist.findFirst({
        where: { cardId: validatedData.cardId },
        orderBy: { order: 'desc' },
        select: { order: true },
      })

      const newOrder = validatedData.order !== 0
        ? validatedData.order
        : (maxOrder?.order ?? -1) + 1

      return tx.checklist.create({
        data: { ...validatedData, order: newOrder, userId },
        include: { items: { orderBy: { order: 'asc' } } },
      })
    })

    return createSuccessResponse(checklist, 'Checklist created successfully', 201)
  } catch (error) {
    return handleAPIError(error, '/api/checklists')
  }
}
