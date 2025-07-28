import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createChecklistSchema } from '@/lib/validations/checklist'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody 
} from '@/lib/api-error-handler'

// GET /api/checklists - Get checklists (optionally filtered by card)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('cardId')

    const whereClause = cardId ? { cardId } : {}

    const checklists = await prisma.checklist.findMany({
      where: whereClause,
      include: {
        items: {
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    return createSuccessResponse(checklists, 'Checklists fetched successfully')
  } catch (error) {
    return handleAPIError(error, '/api/checklists')
  }
}

// POST /api/checklists - Create a new checklist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body using our validation helper
    const validatedData = validateRequestBody(createChecklistSchema, body)

    // Check if card exists
    const card = await prisma.card.findUnique({
      where: { id: validatedData.cardId },
    })

    if (!card) {
      throw new Error('Card not found')
    }

    // Get the current max order for this card's checklists
    const maxOrder = await prisma.checklist.findFirst({
      where: { cardId: validatedData.cardId },
      orderBy: { order: 'desc' },
      select: { order: true }
    })

    const newOrder = validatedData.order || (maxOrder?.order || 0) + 1

    const checklist = await prisma.checklist.create({
      data: {
        ...validatedData,
        order: newOrder,
      },
      include: {
        items: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return createSuccessResponse(checklist, 'Checklist created successfully', 201)
  } catch (error) {
    return handleAPIError(error, '/api/checklists')
  }
} 