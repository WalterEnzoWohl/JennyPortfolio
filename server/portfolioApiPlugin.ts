import { createClient } from '@supabase/supabase-js'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const BUCKET = 'portfolio-media'
const ANALYTICS_BUCKET = 'portfolio-analytics'
const CONTENT_PATH = 'content/portfolio.json'

type PortfolioApiPluginOptions = {
  supabaseUrl?: string
  secretKey?: string
}

export function portfolioApiPlugin({ supabaseUrl, secretKey }: PortfolioApiPluginOptions): Plugin {
  return {
    name: 'local-portfolio-api',
    apply: 'serve',
    configureServer(server) {
      if (!supabaseUrl || !secretKey) return

      const supabaseAdmin = createClient(supabaseUrl, secretKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })

      const requireAdmin = async (request: IncomingMessage) => {
        const authorization = request.headers.authorization
        if (!authorization?.startsWith('Bearer ')) return null

        const { data, error } = await supabaseAdmin.auth.getUser(authorization.slice('Bearer '.length))
        if (error || data.user?.app_metadata?.role !== 'portfolio_admin') return null
        return data.user
      }

      server.middlewares.use('/api/portfolio', async (request, response) => {
        try {
          if (request.method === 'GET') {
            const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(CONTENT_PATH)
            if (error) return sendJson(response, 404, { error: 'Portfolio content not found' })

            response.statusCode = 200
            response.setHeader('Content-Type', 'application/json; charset=utf-8')
            response.setHeader('Cache-Control', 'no-store')
            response.end(Buffer.from(await data.arrayBuffer()))
            return
          }

          if (request.method !== 'POST') return sendJson(response, 405, { error: 'Method not allowed' })

          const body = await readJsonBody(request)

          if (body.action === 'record-visit') {
            const visitedAt = new Date()
            const path = `visits/${visitedAt.toISOString().slice(0, 10)}/${crypto.randomUUID()}.json`
            const record = {
              visitedAt: visitedAt.toISOString(),
              path: sanitizeVisitPath(body.path),
            }
            const { error } = await supabaseAdmin.storage.from(ANALYTICS_BUCKET).upload(
              path,
              new Blob([JSON.stringify(record)], { type: 'application/json' }),
              { contentType: 'application/json', cacheControl: '0' },
            )

            if (error) return sendJson(response, 500, { error: error.message })
            return sendJson(response, 200, { ok: true })
          }

          const admin = await requireAdmin(request)
          if (!admin) return sendJson(response, 401, { error: 'Unauthorized' })

          if (body.action === 'create-upload-url') {
            const kind = body.kind === 'cover' || body.kind === 'video' || body.kind === 'contact'
              ? body.kind
              : null
            if (!kind) return sendJson(response, 400, { error: 'Invalid media kind' })

            const folder = kind === 'video' ? 'videos' : kind === 'cover' ? 'covers' : 'images/contact'
            const extension = extensionFor(body.fileName, body.contentType, kind)
            const path = `${folder}/${sanitizeSegment(body.itemId)}/${crypto.randomUUID()}.${extension}`
            const { data, error } = await supabaseAdmin.storage
              .from(BUCKET)
              .createSignedUploadUrl(path, { upsert: false })

            if (error) return sendJson(response, 500, { error: error.message })

            const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
            return sendJson(response, 200, { path, token: data.token, publicUrl })
          }

          if (body.action === 'save-content') {
            if (!body.content || typeof body.content !== 'object' || !Array.isArray(body.content?.videos?.items)) {
              return sendJson(response, 400, { error: 'Invalid portfolio content' })
            }

            const content = structuredClone(body.content)
            content.videos.items = content.videos.items.map((video: Record<string, unknown>) => {
              const { videoSrc: _videoSrc, ...serializable } = video
              return serializable
            })

            const { error } = await supabaseAdmin.storage.from(BUCKET).upload(
              CONTENT_PATH,
              new Blob([JSON.stringify(content)], { type: 'application/json' }),
              { upsert: true, contentType: 'application/json', cacheControl: '0' },
            )

            if (error) return sendJson(response, 500, { error: error.message })

            const removedPaths = Array.isArray(body.removedPaths)
              ? body.removedPaths.filter(isManagedMediaPath)
              : []
            if (removedPaths.length > 0) {
              const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove(removedPaths)
              if (removeError) console.error('Could not remove old portfolio media', removeError.message)
            }

            return sendJson(response, 200, { ok: true, updatedBy: admin.id })
          }

          return sendJson(response, 400, { error: 'Unknown action' })
        } catch (error) {
          console.error(error)
          return sendJson(response, 500, { error: 'Unexpected server error' })
        }
      })
    },
  }
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > 5 * 1024 * 1024) throw new Error('Request body is too large')
    chunks.push(buffer)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function sendJson(response: ServerResponse, status: number, data: unknown) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(data))
}

function sanitizeSegment(value: unknown) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'media'
}

function sanitizeVisitPath(value: unknown) {
  const path = typeof value === 'string' ? value : '/'
  return path.startsWith('/') ? path.slice(0, 160) : '/'
}

function extensionFor(fileName: unknown, contentType: unknown, kind: 'video' | 'cover' | 'contact') {
  const extension = String(fileName ?? '').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (extension && extension.length <= 5) return extension

  const mime = String(contentType ?? '')
  if (mime === 'video/webm') return 'webm'
  if (mime === 'video/quicktime') return 'mov'
  if (mime === 'image/png') return 'png'
  return kind === 'video' ? 'mp4' : 'jpg'
}

function isManagedMediaPath(path: unknown): path is string {
  return typeof path === 'string'
    && (path.startsWith('videos/') || path.startsWith('covers/') || path.startsWith('images/'))
}
