import { useEffect, useState } from 'react'
import { defaultPortfolioContent, type PortfolioContent, type VideoItem } from './content'
import {
  getPublicMediaUrl,
  getSupabaseRequestHeaders,
  PORTFOLIO_BUCKET,
  PORTFOLIO_FUNCTION_URL,
  supabase,
} from './supabaseClient'

const LEGACY_CONTENT_STORAGE_KEY = 'jenny-portfolio-content-v1'
const REMOTE_CONTENT_PATH = 'content/portfolio.json'

type HydratedContent = {
  content: PortfolioContent
  objectUrls: string[]
}

type UploadResult = {
  path: string
  publicUrl: string
}

type UploadUrlResponse = UploadResult & {
  token: string
}

export function cloneContent(content: PortfolioContent): PortfolioContent {
  return JSON.parse(JSON.stringify(content)) as PortfolioContent
}

export function getDefaultContent(): PortfolioContent {
  return cloneContent(defaultPortfolioContent)
}

export function readStoredContent(): PortfolioContent {
  if (typeof window === 'undefined') return getDefaultContent()

  const raw = window.localStorage.getItem(LEGACY_CONTENT_STORAGE_KEY)
  if (!raw) return getDefaultContent()

  try {
    return mergeContent(getDefaultContent(), JSON.parse(raw))
  } catch {
    return getDefaultContent()
  }
}

export async function loadStoredContent(): Promise<PortfolioContent> {
  let response = await fetch(PORTFOLIO_FUNCTION_URL, {
    method: 'GET',
    headers: getSupabaseRequestHeaders(),
    cache: 'no-store',
  })

  if (!response.ok) {
    response = await fetch(`${getPublicMediaUrl(REMOTE_CONTENT_PATH)}?v=${Date.now()}`, {
      cache: 'no-store',
    })
  }

  if (response.status === 404) return readStoredContent()
  if (!response.ok) throw new Error('No se pudo cargar el contenido desde Supabase.')

  return mergeContent(getDefaultContent(), await response.json())
}

export async function saveStoredContent(content: PortfolioContent, removedPaths: string[] = []) {
  const serializable = cloneContent(content)
  serializable.videos.items = serializable.videos.items.map(stripRuntimeVideoFields)

  await invokeAdminApi({
    action: 'save-content',
    content: serializable,
    removedPaths,
  })

  window.localStorage.removeItem(LEGACY_CONTENT_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('portfolio-content-updated'))
}

export async function uploadPortfolioMedia(
  file: File,
  kind: 'video' | 'cover' | 'contact',
  itemId: string,
): Promise<UploadResult> {
  const upload = await invokeAdminApi<UploadUrlResponse>({
    action: 'create-upload-url',
    kind,
    itemId,
    fileName: file.name,
    contentType: file.type,
  })

  const { error } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .uploadToSignedUrl(upload.path, upload.token, file, {
      contentType: file.type,
      cacheControl: '31536000',
    })

  if (error) throw new Error(error.message)
  return { path: upload.path, publicUrl: upload.publicUrl }
}

export function getRemovedMediaPaths(previous: PortfolioContent, next: PortfolioContent) {
  const previousPaths = collectMediaPaths(previous)
  const nextPaths = collectMediaPaths(next)
  return [...previousPaths].filter((path) => !nextPaths.has(path))
}

export function usePortfolioContent() {
  const [content, setContent] = useState<PortfolioContent>(() => readStoredContent())

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const hydrated = await hydrateContentVideos(await loadStoredContent())
        if (active) setContent(hydrated.content)
      } catch (error) {
        console.error(error)
      }
    }

    void load()
    const handleUpdate = () => void load()
    window.addEventListener('portfolio-content-updated', handleUpdate)

    return () => {
      active = false
      window.removeEventListener('portfolio-content-updated', handleUpdate)
    }
  }, [])

  return content
}

export async function hydrateContentVideos(content: PortfolioContent): Promise<HydratedContent> {
  const hydrated = cloneContent(content)
  hydrated.videos.items = hydrated.videos.items.map((video) => ({
    ...video,
    img: video.posterStorageKey ? getPublicMediaUrl(video.posterStorageKey) : video.img,
    videoSrc: video.storageKey ? getPublicMediaUrl(video.storageKey) : video.videoSrc,
  }))
  if (hydrated.contact.image.storageKey) {
    hydrated.contact.image.src = getPublicMediaUrl(hydrated.contact.image.storageKey)
  }

  return { content: hydrated, objectUrls: [] }
}

async function invokeAdminApi<T = { ok: true }>(body: Record<string, unknown>): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('La sesión de administrador expiró.')

  const response = await fetch(PORTFOLIO_FUNCTION_URL, {
    method: 'POST',
    headers: {
      ...getSupabaseRequestHeaders(accessToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof result.error === 'string' ? result.error : 'Supabase rechazó la operación.')
  }

  return result as T
}

function collectMediaPaths(content: PortfolioContent) {
  const paths = new Set<string>()
  content.videos.items.forEach((video) => {
    if (video.storageKey) paths.add(video.storageKey)
    if (video.posterStorageKey) paths.add(video.posterStorageKey)
  })
  if (content.contact.image.storageKey) paths.add(content.contact.image.storageKey)
  return paths
}

function stripRuntimeVideoFields(video: VideoItem): VideoItem {
  const { videoSrc: _videoSrc, ...serializable } = video
  return serializable
}

function mergeContent(base: PortfolioContent, override: unknown): PortfolioContent {
  return deepMerge(base, override) as PortfolioContent
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (override === undefined || override === null) return base
  if (Array.isArray(base)) return Array.isArray(override) ? override : base
  if (!isObject(base) || !isObject(override)) return override

  const result: Record<string, unknown> = { ...base }
  Object.entries(override).forEach(([key, value]) => {
    result[key] = deepMerge((base as Record<string, unknown>)[key], value)
  })

  return result
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
