import {
  createSuccessResponse,
  handleAPIError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { prisma } from '@/lib/prisma'
import { createTaskSchema, reorderTasksSchema } from '@/lib/validations/task'
import { NextRequest } from 'next/server'

// GET /api/tasks - Get all tasks (optionally filtered by project or column)
export async function GET(request: NextRequest) {
  try {
    
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const columnId = searchParams.get('columnId')
    const includeRelations = searchParams.get('includeRelations') === 'true'

    const whereClause: Record<string, string> = {}
    if (projectId) whereClause.projectId = projectId
    if (columnId) whereClause.columnId = columnId

    const tasks = await prisma.card.findMany({
      where: whereClause,
      include: {
        project: includeRelations ? {
          select: {
            id: true,
            title: true,
          }
        } : false,
        column: includeRelations ? {
          select: {
            id: true,
            title: true,
          }
        } : false,
      },
      orderBy: [
        { columnId: 'asc' },
        { order: 'asc' }
      ],
    })

    return createSuccessResponse(tasks, 'Tasks fetched successfully')
  } catch (error) {
    return handleAPIError(error, '/api/tasks')
  }
}

// POST /api/tasks - Create a new task

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body using our validation helper
    const validatedData = validateRequestBody(createTaskSchema, body)

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
    })

    if (!project) {
      throw new Error('Project not found')
    }

    // Check if column exists and belongs to the project
    const column = await prisma.column.findUnique({
      where: { 
        id: validatedData.columnId,
        projectId: validatedData.projectId,
      },
    })

    if (!column) {
      throw new Error('Column not found or does not belong to the specified project')
    }

    // Determine the position and calculate the order
    const position = validatedData.position || 'bottom'
    let newOrder: number

    if (position && position === 'top') {
      // When inserting at top, we need to increment all existing orders by 1
      // and set the new card's order to 0
      newOrder = 0
      
      // Use a transaction to ensure atomicity
      const task = await prisma.$transaction(async (tx) => {
        // First, increment all existing cards' order by 1
        await tx.card.updateMany({
          where: {
            columnId: validatedData.columnId,
            projectId: validatedData.projectId,
          },
          data: {
            order: {
              increment: 1
            }
          }
        })

        // Then create the new card with order 0
        return await tx.card.create({
          data: {
            title: validatedData.title,
            description: validatedData.description,
            projectId: validatedData.projectId,
            columnId: validatedData.columnId,
            order: newOrder,
          }
        })
      })

      return createSuccessResponse(task, 'Task created successfully at top', 201)
    } else {
      // When inserting at bottom, find the highest order and add 1
      const lastCard = await prisma.card.findFirst({
        where: {
          columnId: validatedData.columnId,
          projectId: validatedData.projectId,
        },
        orderBy: {
          order: 'desc'
        },
        select: {
          order: true
        }
      })

      newOrder = lastCard ? lastCard.order + 1 : 0

      const task = await prisma.card.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          projectId: validatedData.projectId,
          columnId: validatedData.columnId,
          order: newOrder,
        }
      })

      return createSuccessResponse(task, 'Task created successfully at bottom', 201)
    }
  } catch (error) {
    return handleAPIError(error, '/api/tasks')
  }
}

// PUT /api/tasks - Reorder tasks within a column
export async function PUT(request: NextRequest) {
  try {
  
    const body = await request.json()
    
    // Validate the request body using our validation helper
    const validatedData = validateRequestBody(reorderTasksSchema, body)

    // Use a transaction to update all task orders atomically
    await prisma.$transaction(
      validatedData.taskOrders.map(({ id, order }) =>
        prisma.card.update({
          where: { id },
          data: { order },
        })
      )
    )

    return createSuccessResponse(undefined, 'Tasks reordered successfully')
  } catch (error) {
    return handleAPIError(error, '/api/tasks')
  }
}
