import {
  createSuccessResponse,
  handleAPIError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'
import { createTaskSchema, reorderTasksSchema } from '@/lib/validations/task'
import { NextRequest } from 'next/server'

// GET /api/tasks - Get all tasks (optionally filtered by project or column)
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const columnId = searchParams.get('columnId')
    const includeRelations = searchParams.get('includeRelations') === 'true'

    const whereClause: Record<string, string> = { userId }
    if (projectId) whereClause.projectId = projectId
    if (columnId) whereClause.columnId = columnId

    const tasks = await queryAsUser(userId, (tx) =>
      tx.card.findMany({
        where: whereClause,
        include: {
          project: includeRelations ? { select: { id: true, title: true } } : false,
          column: includeRelations ? { select: { id: true, title: true } } : false,
          cardLabels: { include: { label: true } },
        },
        orderBy: [{ columnId: 'asc' }, { order: 'asc' }],
      })
    )

    const tasksWithLabels = tasks.map(task => ({
      ...task,
      labels: task.cardLabels.map(cardLabel => ({
        id: cardLabel.label.id,
        title: cardLabel.label.title,
        color: cardLabel.label.color,
        projectId: cardLabel.label.projectId,
        createdAt: cardLabel.label.createdAt,
        updatedAt: cardLabel.label.updatedAt,
        checked: cardLabel.checked,
      })),
    }))

    return createSuccessResponse(tasksWithLabels, 'Tasks fetched successfully')
  } catch (error) {
    return handleAPIError(error, '/api/tasks')
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(createTaskSchema, body)

    const position = validatedData.position || 'bottom'

    const task = await queryAsUser(userId, async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: validatedData.projectId, userId },
      })
      if (!project) throw new Error('Project not found')

      const column = await tx.column.findUnique({
        where: { id: validatedData.columnId, projectId: validatedData.projectId },
      })
      if (!column) throw new Error('Column not found or does not belong to the specified project')

      if (position === 'top') {
        await tx.card.updateMany({
          where: { columnId: validatedData.columnId, projectId: validatedData.projectId },
          data: { order: { increment: 1 } },
        })

        return tx.card.create({
          data: {
            title: validatedData.title,
            description: validatedData.description,
            projectId: validatedData.projectId,
            columnId: validatedData.columnId,
            order: 0,
            userId,
          },
        })
      }

      const lastCard = await tx.card.findFirst({
        where: { columnId: validatedData.columnId, projectId: validatedData.projectId },
        orderBy: { order: 'desc' },
        select: { order: true },
      })

      return tx.card.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          projectId: validatedData.projectId,
          columnId: validatedData.columnId,
          order: lastCard ? lastCard.order + 1 : 0,
          userId,
        },
      })
    })

    const message = position === 'top'
      ? 'Task created successfully at top'
      : 'Task created successfully at bottom'

    return createSuccessResponse(task, message, 201)
  } catch (error) {
    return handleAPIError(error, '/api/tasks')
  }
}

// PUT /api/tasks - Reorder tasks within a column
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(reorderTasksSchema, body)

    await queryAsUser(userId, (tx) =>
      Promise.all(
        validatedData.taskOrders.map(({ id, order }) =>
          tx.card.update({
            where: { id, userId },
            data: { order },
          })
        )
      )
    )

    return createSuccessResponse(undefined, 'Tasks reordered successfully')
  } catch (error) {
    return handleAPIError(error, '/api/tasks')
  }
}
