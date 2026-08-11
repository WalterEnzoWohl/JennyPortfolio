import { createClient } from 'npm:@supabase/supabase-js@2'

const BUCKET = 'portfolio-media'
const ANALYTICS_BUCKET = 'portfolio-analytics'
const CONTENT_PATH = 'content/portfolio.json'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function getSecretKey() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (secretKeys) {
    const parsed = JSON.parse(secretKeys) as Record<string, string>
    if (parsed.default) return parsed.default
  }

  const legacyKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!legacyKey) throw new Error('Supabase secret key is not configured')
  return legacyKey
}

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, getSecretKey(), {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

async function requireAdmin(request: Request) {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return null

  const token = authorization.slice('Bearer '.length)
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || data.user?.app_metadata?.role !== 'portfolio_admin') return null
  return data.user
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (request.method === 'GET') {
      const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(CONTENT_PATH)
      if (error) return json({ error: 'Portfolio content not found' }, 404)

      return new Response(await data.text(), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    const body = await request.json()

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

      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    const admin = await requireAdmin(request)
    if (!admin) return json({ error: 'Unauthorized' }, 401)

    if (body.action === 'create-upload-url') {
      const kind = body.kind === 'cover' || body.kind === 'video' || body.kind === 'contact'
        ? body.kind
        : null
      if (!kind) return json({ error: 'Invalid media kind' }, 400)

      const folder = kind === 'video' ? 'videos' : kind === 'cover' ? 'covers' : 'images/contact'
      const extension = extensionFor(body.fileName, body.contentType, kind)
      const path = `${folder}/${sanitizeSegment(body.itemId)}/${crypto.randomUUID()}.${extension}`
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUploadUrl(path, { upsert: false })

      if (error) return json({ error: error.message }, 500)

      const publicUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      return json({ path, token: data.token, publicUrl })
    }

    if (body.action === 'save-content') {
      if (!body.content || typeof body.content !== 'object' || !Array.isArray(body.content?.videos?.items)) {
        return json({ error: 'Invalid portfolio content' }, 400)
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

      if (error) return json({ error: error.message }, 500)

      const removedPaths = Array.isArray(body.removedPaths)
        ? body.removedPaths.filter(isManagedMediaPath)
        : []

      if (removedPaths.length > 0) {
        const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove(removedPaths)
        if (removeError) console.error('Could not remove old portfolio media', removeError.message)
      }

      return json({ ok: true, updatedBy: admin.id })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (error) {
    console.error(error)
    return json({ error: 'Unexpected server error' }, 500)
  }
})
