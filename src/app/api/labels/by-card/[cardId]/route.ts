import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  handleAPIError, 
  createSuccessResponse, 
  NotFoundError 
} from '@/lib/api-error-handler'
import { TLabelWithChecked } from '@/models/label'

// GET /api/labels/by-card/[cardId] - Get all labels for a project with checked status for a specific card
export async function GET(request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const { cardId } = await params

    // First, get the card to find the projectId
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { projectId: true }
    })

    if (!card) {
      throw new NotFoundError('Card')
    }

    // Get all labels for the project with their checked status for this specific card
    const labelsWithCheckedStatus = await prisma.label.findMany({
      where: {
        projectId: card.projectId
      },
      include: {
        cardLabels: {
          where: {
            cardId: cardId
          },
          select: {
            checked: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Transform the data to match TLabelWithChecked type
    const response: TLabelWithChecked[] = labelsWithCheckedStatus.map(label => ({
      id: label.id,
      title: label.title,
      color: label.color,
      projectId: label.projectId,
      createdAt: label.createdAt,
      updatedAt: label.updatedAt,
      checked: label.cardLabels.length > 0 ? label.cardLabels[0].checked : false
    }))

    return createSuccessResponse(response, 'Labels with checked status fetched successfully')
  } catch (error) {
    const { cardId } = await params
    return handleAPIError(error, `/api/labels/by-card/${cardId}`)
  }
}
