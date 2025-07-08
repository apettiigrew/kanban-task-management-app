import {
  createSuccessResponse,
  handleAPIError,
  validateRequestBody
} from '@/lib/api-error-handler'
import { prisma } from '@/lib/prisma'
import { createProjectSchema } from '@/lib/validations/project'
import { NextRequest } from 'next/server'

// GET /api/projects - Get all projects
export async function GET(request: NextRequest) {
  try {
    
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'
    const includeRelations = searchParams.get('includeRelations') === 'true'

    const projects = await prisma.project.findMany({
      include: {
        columns: includeRelations,
        cards: includeRelations ? {
          select: {
            id: true,
            title: true,
            order: true,
            columnId: true,
            createdAt: true,
          }
        } : false
      },
    })

    return createSuccessResponse(projects, 'Projects fetched successfully')
  } catch (error) {
    return handleAPIError(error, '/api/projects')
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
   

    const body = await request.json()
    
    // Validate the request body using our validation helper
    const validatedData = validateRequestBody(createProjectSchema, body)

    const project = await prisma.project.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            cards: true,
            columns: true,
          }
        }
      }
    })

    // Transform to include stats
    const { _count, ...projectData } = project
    const transformedProject = {
      ...projectData,
      taskCount: _count.cards,
      columnCount: _count.columns,
    }

    return createSuccessResponse(
      transformedProject,
      'Project created successfully',
      201
    )
  } catch (error) {
    return handleAPIError(error, '/api/projects')
  }
}