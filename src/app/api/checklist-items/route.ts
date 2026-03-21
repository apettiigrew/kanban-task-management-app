import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createChecklistItemSchema } from '@/lib/validations/checklist'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'

// GET /api/checklist-items - Get checklist items (optionally filtered by checklist)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const checklistId = searchParams.get('checklistId')

    const whereClause = checklistId ? { checklistId, userId } : { userId }

    const items = await prisma.checklistItem.findMany({
      where: whereClause,
      orderBy: {
        order: 'asc'
      }
    })

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

    // Check if checklist exists and belongs to the authenticated user (multitenancy)
    const checklist = await prisma.checklist.findUnique({
      where: { id: validatedData.checklistId, userId },
    })

    if (!checklist) {
      throw new NotFoundError('Checklist')
    }

    // Get the current max order for this checklist's items
    const maxOrder = await prisma.checklistItem.findFirst({
      where: { checklistId: validatedData.checklistId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    // Use explicit order if provided and non-zero, otherwise auto-increment
    const newOrder = validatedData.order !== 0
      ? validatedData.order
      : (maxOrder?.order ?? -1) + 1

    const checklistItem = await prisma.checklistItem.create({
      data: {
        ...validatedData,
        order: newOrder,
        userId,
      }
    })

    return createSuccessResponse(checklistItem, 'Checklist item created successfully', 201)
  } catch (error) {
    return handleAPIError(error, '/api/checklist-items')
  }
}
