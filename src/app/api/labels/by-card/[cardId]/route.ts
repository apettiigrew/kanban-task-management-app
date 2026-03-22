import { NextRequest } from 'next/server'
import {
  handleAPIError,
  createSuccessResponse,
  NotFoundError
} from '@/lib/api-error-handler'
import { getUserIdFromRequest } from '@/lib/auth-helpers'
import { queryAsUser } from '@/lib/db'
import { TLabelWithChecked } from '@/models/label'

// GET /api/labels/by-card/[cardId] - Get all labels for a project with checked status for a specific card
export async function GET(request: NextRequest, { params }: { params: Promise<{ cardId: string }> }) {
  try {
    const userId = getUserIdFromRequest(request)
    const { cardId } = await params

    const labelsWithCheckedStatus = await queryAsUser(userId, async (tx) => {
      const card = await tx.card.findUnique({
        where: { id: cardId, userId },
        select: { projectId: true },
      })
      if (!card) throw new NotFoundError('Card')

      return tx.label.findMany({
        where: { projectId: card.projectId },
        include: { cardLabels: { where: { cardId } } },
        orderBy: { createdAt: 'asc' },
      })
    })

    const response: TLabelWithChecked[] = labelsWithCheckedStatus.map(label => ({
      id: label.id,
      title: label.title,
      color: label.color,
      projectId: label.projectId,
      createdAt: label.createdAt,
      updatedAt: label.updatedAt,
      checked: label.cardLabels.length > 0 ? label.cardLabels[0].checked : false,
    }))

    return createSuccessResponse(response, 'Labels with checked status fetched successfully')
  } catch (error) {
    const { cardId } = await params
    return handleAPIError(error, `/api/labels/by-card/${cardId}`)
  }
}
