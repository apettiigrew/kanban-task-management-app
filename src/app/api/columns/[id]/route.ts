import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateColumnSchema } from '@/lib/validations/column'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  checkRateLimit,
  NotFoundError
} from '@/lib/api-error-handler'

// GET /api/columns/[id] - Get a specific column
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  
    const { searchParams } = new URL(request.url)
    const includeTasks = searchParams.get('includeTasks') === 'true'

    const column = await prisma.column.findUnique({
      where: { id: params.id },
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

    if (!column) {
      throw new NotFoundError('Column')
    }

    return createSuccessResponse(column, 'Column fetched successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${params.id}`)
  }
}

// PUT /api/columns/[id] - Update a specific column
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate the request body using our validation helper
    const validatedData = validateRequestBody(updateColumnSchema, body)

    // Check if column exists
    const existingColumn = await prisma.column.findUnique({
      where: { id: params.id },
    })

    if (!existingColumn) {
      throw new NotFoundError('Column')
    }

    const column = await prisma.column.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })
  
    return createSuccessResponse(column, 'Column updated successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${params.id}`)
  }
}

// DELETE /api/columns/[id] - Delete a specific column
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
  
    // Check if column exists
    const existingColumn = await prisma.column.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            cards: true,
          }
        }
      }
    })

    if (!existingColumn) {
      throw new NotFoundError('Column')
    }

    await prisma.card.deleteMany({
      where: {
        columnId: params.id
      }
    })
    
    await prisma.column.delete({
      where: { id: params.id },
    })

    // reorder the columns in prisma
    await prisma.column.updateMany({
      where: {
        projectId: existingColumn.projectId
      },
      data: {
        order: { decrement: 1 }
      }
    })

    return createSuccessResponse(undefined, 'Column deleted successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${params.id}`)
  }
}