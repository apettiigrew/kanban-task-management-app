import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createChecklistItemSchema } from '@/lib/validations/checklist'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody 
} from '@/lib/api-error-handler'

// GET /api/checklist-items - Get checklist items (optionally filtered by checklist)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const checklistId = searchParams.get('checklistId')

    const whereClause = checklistId ? { checklistId } : {}

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
    const body = await request.json()
    
    // Validate the request body using our validation helper
    const validatedData = validateRequestBody(createChecklistItemSchema, body)

    // Check if checklist exists
    const checklist = await prisma.checklist.findUnique({
      where: { id: validatedData.checklistId },
    })

    if (!checklist) {
      throw new Error('Checklist not found')
    }

    // Get the current max order for this checklist's items
    const maxOrder = await prisma.checklistItem.findFirst({
      where: { checklistId: validatedData.checklistId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const newOrder = validatedData.order || (maxOrder?.order || 0) + 1

    const checklistItem = await prisma.checklistItem.create({
      data: {
        ...validatedData,
        order: newOrder,
      }
    })

    return createSuccessResponse(checklistItem, 'Checklist item created successfully', 201)
  } catch (error) {
    return handleAPIError(error, '/api/checklist-items')
  }
} 