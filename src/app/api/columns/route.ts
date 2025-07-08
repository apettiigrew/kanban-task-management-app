import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createColumnSchema, reorderColumnsSchema } from '@/lib/validations/column'
import { 
  handleAPIError, 
  createSuccessResponse, 
  validateRequestBody,
  checkRateLimit 
} from '@/lib/api-error-handler'

// GET /api/columns - Get all columns (optionally filtered by project)
export async function GET(request: NextRequest) {
  try {
  
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const includeTasks = searchParams.get('includeTasks') === 'true'

    const whereClause = projectId ? { projectId } : {}

    const columns = await prisma.column.findMany({
      where: whereClause,
      include: {
        cards: includeTasks,
        project: {
          select: {
            id: true,
            title: true,
          }
        }
      },
    })

    return createSuccessResponse(columns, 'Columns fetched successfully')
  } catch (error) {
    return handleAPIError(error, '/api/columns')
  }
}

// POST /api/columns - Create a new column
export async function POST(request: NextRequest) {
  try {
  
    const body = await request.json()
    
    // Validate the request body using our validation helper
    const validatedData = validateRequestBody(createColumnSchema, body)

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
    })

    if (!project) {
      throw new Error('Project not found')
    }

    const column = await prisma.column.create({
      data: {
        ...validatedData
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          }
        },
        cards: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    console.log(column)
    return createSuccessResponse(column, 'Column created successfully', 201)
  } catch (error) {
    return handleAPIError(error, '/api/columns')
  }
}

// PUT /api/columns - Reorder columns
export async function PUT(request: NextRequest) {
  try {
  
    const body = await request.json()
    
    // Validate the request body using our validation helper
    const validatedData = validateRequestBody(reorderColumnsSchema, body)

    // Use a transaction to update all column orders atomically
    await prisma.$transaction(
      validatedData.columnOrders.map(({ id, order }) =>
        prisma.column.update({
          where: { id },
          data: { order },
        })
      )
    )

    return createSuccessResponse(undefined, 'Columns reordered successfully')
  } catch (error) {
    return handleAPIError(error, '/api/columns')
  }
}