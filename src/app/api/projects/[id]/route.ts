import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateProjectSchema } from '@/lib/validations/project'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  checkRateLimit,
  NotFoundError
} from '@/lib/api-error-handler'

// GET /api/projects/[id] - Get a specific project
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }>}) {
  try {
    const { id } = await params;

    // order columsn by order fields in ascending order
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: {
            order: 'asc'
          },
          include: {
            cards: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      },
    })

    if (!project) {
      throw new NotFoundError('Project')
    }

    return createSuccessResponse(project, 'Project fetched successfully')
  } catch (error) {
    const { id } = await params;
    return handleAPIError(error, `/api/projects/${id}`)
  }
}

// PUT /api/projects/[id] - Update a specific project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()

    // Validate the request body using our validation helper
    const validatedData = validateRequestBody(updateProjectSchema, body)

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    })

    if (!existingProject) {
      throw new NotFoundError('Project')
    }

    const project = await prisma.project.update({
      where: { id },
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

    return createSuccessResponse(transformedProject, 'Project updated successfully')
  } catch (error) {
    const { id } = await params;
    return handleAPIError(error, `/api/projects/${id}`)
  }
}

// DELETE /api/projects/[id] - Delete a specific project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    })

    if (!existingProject) {
      throw new NotFoundError('Project')
    }

    // Delete the project (cascade deletion will handle related columns and tasks)
    await prisma.project.delete({
      where: { id },
    })

    return createSuccessResponse(undefined, 'Project deleted successfully')
  } catch (error) {
    const { id } = await params;
    return handleAPIError(error, `/api/projects/${id}`)
  }
}