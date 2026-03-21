import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateColumnSchema } from '@/lib/validations/column'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'

// GET /api/columns/[id] - Get a specific column
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const includeTasks = searchParams.get('includeTasks') === 'true'

    // Scope the lookup to the authenticated user (multitenancy)
    const column = await prisma.column.findUnique({
      where: { id: params.id, userId },
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
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()

    // Validate the request body using our validation helper
    const validatedData = validateRequestBody(updateColumnSchema, body)

    // Check if column exists and belongs to the authenticated user (multitenancy)
    const existingColumn = await prisma.column.findUnique({
      where: { id: params.id, userId },
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
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = getUserIdFromRequest(request)

    // Check if column exists and belongs to the authenticated user (multitenancy)
    const existingColumn = await prisma.column.findUnique({
      where: { id: params.id, userId },
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

    // Perform all operations in a transaction
    await prisma.$transaction(async (tx) => {
      // delete all cards that belong to the column
      await tx.card.deleteMany({
        where: {
          columnId: params.id
        }
      })

      // delete the column
      await tx.column.delete({
        where: { id: params.id },
      })

      // get remaining columns to reorder
      const remainingColumns = await tx.column.findMany({
        where: {
          projectId: existingColumn.projectId
        },
        orderBy: {
          order: 'asc'
        }
      })

      // reorder the columns that come after the deleted column
      const updatePromises = remainingColumns
        .map((column, index) => {
          if (column.order > existingColumn.order) {
            return tx.column.update({
              where: { id: column.id },
              data: {
                order: index
              }
            })
          }
        })

      // execute all reorder updates
      await Promise.all(updatePromises)
    })
    return createSuccessResponse(undefined, 'Column deleted successfully')
  } catch (error) {
    return handleAPIError(error, `/api/columns/${params.id}`)
  }
}