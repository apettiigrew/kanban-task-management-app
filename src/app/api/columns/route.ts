import { NextRequest } from 'next/server'
import { createColumnSchema, reorderColumnsSchema } from '@/lib/validations/column'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError,
  checkRateLimit
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'

// GET /api/columns - Get all columns (optionally filtered by project)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const includeTasks = searchParams.get('includeTasks') === 'true'

    const whereClause = projectId ? { projectId, userId } : { userId }

    const columns = await queryAsUser(userId, (tx) =>
      tx.column.findMany({
        where: whereClause,
        include: {
          cards: includeTasks
            ? {
                include: {
                  cardLabels: {
                    select: {
                      id: true,
                      cardId: true,
                      labelId: true,
                      label: { select: { id: true, title: true, color: true } },
                    },
                  },
                },
                orderBy: { order: 'asc' },
              }
            : false,
          project: { select: { id: true, title: true } },
        },
        orderBy: { order: 'asc' },
      })
    )

    const columnsWithLabels = columns.map(column => ({
      ...column,
      cards: column.cards
        ? column.cards.map(card => ({
            ...card,
            labels: card.cardLabels.map(cardLabel => ({
              id: cardLabel.label.id,
              title: cardLabel.label.title,
              color: cardLabel.label.color,
              projectId: cardLabel.label.projectId,
              createdAt: cardLabel.label.createdAt,
              updatedAt: cardLabel.label.updatedAt,
              checked: cardLabel.checked,
            })),
          }))
        : [],
    }))

    return createSuccessResponse(columnsWithLabels, 'Columns fetched successfully')
  } catch (error) {
    return handleAPIError(error, '/api/columns')
  }
}

// POST /api/columns - Create a new column
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(createColumnSchema, body)

    const column = await queryAsUser(userId, async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: validatedData.projectId, userId },
      })
      if (!project) throw new NotFoundError('Project')

      return tx.column.create({
        data: { ...validatedData, userId },
        include: {
          project: { select: { id: true, title: true } },
          cards: { select: { id: true, title: true } },
        },
      })
    })

    return createSuccessResponse(column, 'Column created successfully', 201)
  } catch (error) {
    return handleAPIError(error, '/api/columns')
  }
}

// PUT /api/columns - Reorder columns
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(reorderColumnsSchema, body)

    await queryAsUser(userId, async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: validatedData.projectId, userId },
      })
      if (!project) throw new NotFoundError('Project')

      await Promise.all(
        validatedData.columnOrders.map(({ id, order }) =>
          tx.column.update({
            where: { id, userId },
            data: { order },
          })
        )
      )
    })

    return createSuccessResponse(undefined, 'Columns reordered successfully')
  } catch (error) {
    return handleAPIError(error, '/api/columns')
  }
}
