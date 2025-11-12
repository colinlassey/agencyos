import { prisma } from '../../../lib/prisma'
import { withApiAuth } from '../../../lib/api'
import { feedbackSchema } from '../../../lib/validators/feedback'

export default withApiAuth(async ({ req, res, session }) => {
  if (req.method === 'POST') {
    const parsed = feedbackSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }

    const feedback = await prisma.feedback.create({
      data: {
        ...parsed.data,
        authorId: session.user.id,
        clientId: parsed.data.targetType === 'PROJECT' ? (await prisma.project.findUnique({ where: { id: parsed.data.targetId } }))?.clientId ?? undefined : undefined,
        projectId: parsed.data.targetType === 'PROJECT' ? parsed.data.targetId : undefined,
        taskId: parsed.data.targetType === 'TASK' ? parsed.data.targetId : undefined,
      },
    })

    res.status(201).json({ feedback })
    return
  }

  res.setHeader('Allow', 'POST')
  res.status(405).end('Method Not Allowed')
}, 'feedback:write')
