import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLabelSchema } from '@/lib/validations/label'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody 
} from '@/lib/api-error-handler'
import { TLabel } from '@/models/label'

// GET /api/labels - Get all labels (optionally filtered by project)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const whereClause = projectId ? { projectId } : {}

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
    const body = await request.json()
    const validatedData = validateRequestBody(createLabelSchema, body)

    const label = await prisma.label.create({
      data: validatedData
    })

    const response: TLabel = label

    return createSuccessResponse(response, 'Label created successfully', 201)
  } catch (error) {
    return handleAPIError(error, '/api/labels')
  }
}
