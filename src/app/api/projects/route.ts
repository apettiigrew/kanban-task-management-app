import {
  createSuccessResponse,
  handleAPIError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'
import { createProjectSchema } from '@/lib/validations/project'
import { NextRequest } from 'next/server'

// GET /api/projects - Get all projects
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    // #region agent log
    import('fs').then(fs=>fs.appendFileSync('/Users/andrewpettigrew/Documents/Projects/Personal/Personal/kanban-app/.cursor/debug-8bc891.log',JSON.stringify({sessionId:'8bc891',timestamp:Date.now(),location:'projects/route.ts:GET',message:'GET /api/projects reached',data:{userIdPrefix:userId.substring(0,8)},hypothesisId:'A'})+'\n')).catch(()=>{})
    const { searchParams } = new URL(request.url)
    const includeRelations = searchParams.get('includeRelations') === 'true'
    const includeArchived = searchParams.get('includeArchived') === 'true'

    const projects = await queryAsUser(userId, (tx) =>
      tx.project.findMany({
        where: { userId, ...(includeArchived ? {} : { isArchived: false }) },
        include: {
          columns: includeRelations,
          cards: includeRelations
            ? { select: { id: true, title: true, order: true, columnId: true, createdAt: true } }
            : false,
        },
      })
    )

    return createSuccessResponse(projects, 'Projects fetched successfully')
  } catch (error) {
    return handleAPIError(error, '/api/projects')
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const validatedData = validateRequestBody(createProjectSchema, body)

    const project = await queryAsUser(userId, (tx) =>
      tx.project.create({
        data: { ...validatedData, userId },
        include: {
          _count: {
            select: { cards: true, columns: true },
          },
        },
      })
    )

    const { _count, ...projectData } = project
    const transformedProject = {
      ...projectData,
      taskCount: _count.cards,
      columnCount: _count.columns,
    }

    return createSuccessResponse(transformedProject, 'Project created successfully', 201)
  } catch (error) {
    return handleAPIError(error, '/api/projects')
  }
}
