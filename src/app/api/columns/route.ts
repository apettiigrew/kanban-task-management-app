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
        cards: includeTasks ? {
          include: {
            cardLabels: {
              select: {
                id: true,
                cardId: true,
                labelId: true,
                label: {
                  select: {
                    id: true,
                    title: true,
                    color: true,
                  }
                }
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        } : false,
        project: {
          select: {
            id: true,
            title: true,
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    // Transform the data to include labels with checked status for cards
    const columnsWithLabels = columns.map(column => ({
      ...column,
      cards: column.cards ? column.cards.map(card => ({
        ...card,
        labels: card.cardLabels.map(cardLabel => ({
          id: cardLabel.label.id,
          title: cardLabel.label.title,
          color: cardLabel.label.color,
          projectId: cardLabel.label.projectId,
          createdAt: cardLabel.label.createdAt,
          updatedAt: cardLabel.label.updatedAt,
          checked: cardLabel.checked
        }))
      })) : []
    }))

    return createSuccessResponse(columnsWithLabels, 'Columns fetched successfully')
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