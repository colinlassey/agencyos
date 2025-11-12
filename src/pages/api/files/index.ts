import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prisma } from '../../../lib/prisma'
import { withApiAuth } from '../../../lib/api'

const s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' })

export default withApiAuth(async ({ req, res, session }) => {
  if (req.method === 'GET') {
    const { clientId, projectId } = req.query
    const files = await prisma.fileObject.findMany({
      where: {
        deletedAt: null,
        clientId: typeof clientId === 'string' ? clientId : undefined,
        projectId: typeof projectId === 'string' ? projectId : undefined,
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ files })
    return
  }

  if (req.method === 'POST') {
    const { filename, contentType, clientId, projectId, size } = req.body
    if (!filename || !contentType || !size) {
      res.status(400).json({ error: 'INVALID_PAYLOAD' })
      return
    }

    const key = `${clientId ?? 'general'}/${projectId ?? 'misc'}/${Date.now()}-${filename}`

    const signedUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME ?? 'agencyos-dev',
        Key: key,
        ContentType: contentType,
        ACL: 'private',
      }),
      { expiresIn: 3600 },
    )

    await prisma.fileObject.create({
      data: {
        key,
        filename,
        contentType,
        size,
        url: `https://${process.env.S3_BUCKET_NAME ?? 'agencyos-dev'}.s3.amazonaws.com/${key}`,
        clientId,
        projectId,
        uploaderId: session.user.id,
      },
    })

    res.status(201).json({ signedUrl, key })
    return
  }

  res.setHeader('Allow', 'GET,POST')
  res.status(405).end('Method Not Allowed')
}, 'file:write')
