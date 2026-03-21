import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLabelSchema } from '@/lib/validations/label'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody 
} from '@/lib/api-error-handler'
import { TCardLabel, TLabel } from '@/models/label'
import { getUserIdFromRequest } from '@/lib/auth-helpers'

// GET /api/labels - Get all labels (optionally filtered by project)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const whereClause = projectId ? { projectId, userId } : { userId }

    const labels = await prisma.label.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'asc'
      }
    })

    const response: TLabel[] = labels

    return createSuccessResponse(response, 'Labels fetched successfully')
  } catch (error) {
    return handleAPIError(error, '/api/labels')
  }
}

// POST /api/labels - Create a new label
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    
    const validatedData = validateRequestBody(createLabelSchema, body)

    const cardLabel = await prisma.$transaction(async (tx) => {
      const label = await tx.label.create({
        data: {
          title: validatedData.title,
          color: validatedData.color,
          projectId: validatedData.projectId,
          userId
        }
      })

      return tx.cardLabel.create({
        data: {
          cardId: validatedData.cardId,
          labelId: label.id,
          checked: true,
          userId
        }
      })
    })

    const response: TCardLabel = cardLabel

    return createSuccessResponse(response, 'Card Label created successfully', 201)
  } catch (error) {
    return handleAPIError(error, '/api/labels')
  }
}
