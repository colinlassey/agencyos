import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const bucket = process.env.STORAGE_BUCKET ?? 'agencyos-local'
const region = process.env.STORAGE_REGION ?? 'us-east-1'
const endpoint = process.env.STORAGE_ENDPOINT
const accessKeyId = process.env.STORAGE_ACCESS_KEY ?? 'local-access-key'
const secretAccessKey = process.env.STORAGE_SECRET_KEY ?? 'local-secret-key'

export const s3Client = new S3Client({
  region,
  endpoint,
  forcePathStyle: Boolean(endpoint),
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

export async function createUploadUrl(key: string, contentType: string, expiresIn = 900) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

export async function createDownloadUrl(key: string, expiresIn = 900) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

export function resolveStorageKey(parts: { clientId?: string; projectId?: string; filename: string; version?: number }) {
  const segments = ['clients']
  if (parts.clientId) {
    segments.push(parts.clientId)
  } else {
    segments.push('unassigned')
  }
  if (parts.projectId) {
    segments.push('projects', parts.projectId)
  }
  const version = parts.version ?? Date.now()
  segments.push(`${version}-${parts.filename}`)
  return segments.join('/')
}

export function publicFileUrl(key: string) {
  if (process.env.STORAGE_PUBLIC_URL) {
    return `${process.env.STORAGE_PUBLIC_URL.replace(/\/$/, '')}/${key}`
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}
