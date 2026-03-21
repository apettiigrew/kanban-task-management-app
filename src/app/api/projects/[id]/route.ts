import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateProjectSchema } from '@/lib/validations/project'
import {
  handleAPIError,
  createSuccessResponse,
  validateRequestBody,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { TProject } from '@/models/project';

// GET /api/projects/[id] - Get a specific project
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(request);

    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        columns: {
          orderBy: {
            order: 'asc'
          },
          include: {
            cards: {
              orderBy: {
                order: 'asc'
              },
              include: {
                checklists: {
                  select: {
                    id: true, // only include id if needed
                    _count: {
                      select: { items: true }
                    },
                    items: {
                      select: { isCompleted: true }
                    }
                  }
                },
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
                    },
                    checked: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      throw new NotFoundError('Project')
    }

    // get all items in all checklists
    const transformedProject = {
      ...project, 
      columns: project.columns.map((column) => {
        const transformedCards = column.cards.map((card) => {
          let totalChecklistItems = 0;
          let totalCompletedChecklistItems = 0;

          card.checklists.forEach((checklist) => {
            totalChecklistItems += checklist._count.items;
            totalCompletedChecklistItems += checklist.items.filter((item) => item.isCompleted).length;
          });



          return {
            ...card,
            totalChecklistItems,
            totalCompletedChecklistItems,
            labels: card.cardLabels.map(cardLabel => ({
              id: cardLabel.id,
              title: cardLabel.label.title,
              color: cardLabel.label.color,
              checked: cardLabel.checked
            }))
          };
        });

        return {
          ...column,
          cards: transformedCards,
        };
      }),
    };

    return createSuccessResponse(transformedProject, 'Project fetched successfully')
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
    const userId = getUserIdFromRequest(request);
    const body = await request.json()

    const validatedData = validateRequestBody(updateProjectSchema, body)

    const existingProject = await prisma.project.findFirst({
      where: { id, userId },
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

// DELETE /api/projects/[id] - Archive (soft-delete) a specific project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getUserIdFromRequest(request);

    const existingProject = await prisma.project.findFirst({
      where: { id, userId },
    })

    if (!existingProject) {
      throw new NotFoundError('Project')
    }

    const jamaicaDeletedAt = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'America/Jamaica' })
    )

    const project = await prisma.project.update({
      where: { id },
      data: {
        isArchived: true,
        deletedAt: jamaicaDeletedAt,
      },
      include: {
        _count: {
          select: {
            cards: true,
            columns: true,
          }
        }
      }
    })

    const { _count, ...projectData } = project
    const transformedProject = {
      ...projectData,
      taskCount: _count.cards,
      columnCount: _count.columns,
    }

    return createSuccessResponse(transformedProject, 'Project archived successfully')
  } catch (error) {
    const { id } = await params;
    return handleAPIError(error, `/api/projects/${id}`)
  }
}