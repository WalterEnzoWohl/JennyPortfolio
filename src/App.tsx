import { lazy, Suspense, useState, useEffect, useRef, type CSSProperties, type Dispatch, type RefObject, type SetStateAction, type SVGProps } from 'react'
import type { Area, Point } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import AdminPage from './AdminPage'
import type { ContactIcon, ImageAsset, PortfolioContent, VideoItem } from './content'
import {
  cloneContent,
  getRemovedMediaPaths,
  hydrateContentVideos,
  loadStoredContent,
  readStoredContent,
  saveStoredContent,
  uploadPortfolioMedia,
  usePortfolioContent,
} from './contentStorage'
import { useHeroIntroAnimation } from './hooks/useHeroIntroAnimation'
import { recordPortfolioVisit } from './visitTracking'
import { formatMegabytes, MAX_SOURCE_VIDEO_BYTES, MAX_UPLOAD_VIDEO_BYTES } from './videoLimits'

const CoverCropper = lazy(() => import('react-easy-crop'))

type ScrollFrameSequence = {
  id: 'landscape' | 'portrait'
  frameCount: number
  framePath: (index: number) => string
}

const scrollFrameSequences = {
  landscape: {
    id: 'landscape',
    frameCount: 60,
    framePath: (index: number) => `/video-jenny/frame-${String(index).padStart(2, '0')}.jpg`,
  },
  portrait: {
    id: 'portrait',
    frameCount: 60,
    framePath: (index: number) => `/video-jenny/frame-${String(index).padStart(2, '0')}.jpg`,
  },
} satisfies Record<string, ScrollFrameSequence>

function getScrollFrameSequence(): ScrollFrameSequence {
  const shouldUsePortraitFrames = window.innerWidth <= 640 || window.innerHeight > window.innerWidth

  return shouldUsePortraitFrames ? scrollFrameSequences.portrait : scrollFrameSequences.landscape
}

function useScrollFrameBackground(containerRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const getAnimatedSequence = () => container.querySelector<HTMLElement>('#intro-sequence')
    const getAnimatedEnd = () => container.querySelector<HTMLElement>('#marcas') ?? getAnimatedSequence()

    let current = 0
    let target = 0
    let animationFrame = 0
    let activeFrame = 0
    let sequence = getScrollFrameSequence()
    let preloadedFrames: Array<{ src: string; image: HTMLImageElement }> = []
    let preloadedFrameSrcs = new Set<string>()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const setFrame = (progress: number) => {
      const nextFrame = Math.min(sequence.frameCount, Math.max(1, Math.round(progress * (sequence.frameCount - 1)) + 1))

      if (nextFrame !== activeFrame) {
        activeFrame = nextFrame
        container.style.setProperty('--scroll-frame', `url("${sequence.framePath(activeFrame)}")`)
        preloadFrames(activeFrame)
      }
    }

    const preloadFrame = (index: number) => {
      if (index < 1 || index > sequence.frameCount) return

      const src = sequence.framePath(index)
      if (preloadedFrameSrcs.has(src)) return

      const image = new Image()
      image.src = src
      preloadedFrames.push({ src, image })
      preloadedFrameSrcs.add(src)

      if (preloadedFrames.length > 36) {
        const removed = preloadedFrames.shift()
        if (removed) preloadedFrameSrcs.delete(removed.src)
      }
    }

    const preloadFrames = (centerFrame: number) => {
      const radius = sequence.id === 'landscape' ? 8 : 12

      preloadFrame(1)

      for (let offset = 0; offset <= radius; offset += 1) {
        preloadFrame(centerFrame - offset)
        preloadFrame(centerFrame + offset)
      }
    }

    const resetPreloadedFrames = () => {
      preloadedFrames = []
      preloadedFrameSrcs = new Set<string>()
    }

    const preloadInitialFrames = () => {
      preloadedFrames = Array.from({ length: Math.min(sequence.frameCount, 12) }, (_, index) => {
        const src = sequence.framePath(index + 1)
        preloadedFrameSrcs.add(src)
        const image = new Image()
        image.src = src
        return { src, image }
      })
    }

    const updateSequence = () => {
      const nextSequence = getScrollFrameSequence()

      if (nextSequence.id !== sequence.id) {
        sequence = nextSequence
        activeFrame = 0
        resetPreloadedFrames()
        preloadInitialFrames()
        setFrame(current)
      }
    }

    const updateTarget = () => {
      const animatedSequence = getAnimatedSequence()

      if (animatedSequence) {
        const animatedEnd = getAnimatedEnd()
        const start = animatedSequence.offsetTop
        const end = animatedEnd ? animatedEnd.offsetTop + animatedEnd.offsetHeight : start + animatedSequence.offsetHeight
        const range = Math.max(end - start, 1)

        target = Math.min(1, Math.max(0, (window.scrollY - start) / range))
      } else {
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
        target = window.scrollY / maxScroll
      }

      if (reduceMotion) {
        current = target
        setFrame(current)
      }
    }

    const tick = () => {
      current += (target - current) * 0.08
      setFrame(current)
      animationFrame = window.requestAnimationFrame(tick)
    }

    preloadInitialFrames()
    setFrame(0)
    updateTarget()

    if (!reduceMotion) {
      animationFrame = window.requestAnimationFrame(tick)
    }

    const handleResize = () => {
      updateSequence()
      updateTarget()
    }

    window.addEventListener('scroll', updateTarget, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      resetPreloadedFrames()
      window.removeEventListener('scroll', updateTarget)
      window.removeEventListener('resize', handleResize)
      window.cancelAnimationFrame(animationFrame)
    }
  }, [containerRef])
}

type ContentPath = Array<string | number>

type PortfolioEditor = {
  isEditing: boolean
  setText: (path: ContentPath, value: string) => void
  setContent: Dispatch<SetStateAction<PortfolioContent>>
}

type EditableTextProps = {
  value: string
  path: ContentPath
  editor?: PortfolioEditor
  className?: string
  style?: CSSProperties
  as?: 'span' | 'div'
}

function useAdminPortfolioContent() {
  const initialContentRef = useRef<PortfolioContent>(readStoredContent())
  const [content, setContentState] = useState<PortfolioContent>(initialContentRef.current)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [undoDepth, setUndoDepth] = useState(0)
  const objectUrlsRef = useRef<string[]>([])
  const persistedContentRef = useRef<PortfolioContent>(cloneContent(initialContentRef.current))
  const contentRef = useRef<PortfolioContent>(initialContentRef.current)
  const historyRef = useRef<PortfolioContent[]>([])

  useEffect(() => {
    let active = true

    const hydrate = async () => {
      try {
        const stored = await loadStoredContent()
        const hydrated = await hydrateContentVideos(stored)
        if (!active) return

        objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
        objectUrlsRef.current = hydrated.objectUrls
        persistedContentRef.current = cloneContent(hydrated.content)
        contentRef.current = hydrated.content
        historyRef.current = []
        setUndoDepth(0)
        setContentState(hydrated.content)
      } catch {
        if (active) setMessage('No se pudo cargar el contenido de Supabase.')
      }
    }

    void hydrate()

    return () => {
      active = false
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrlsRef.current = []
    }
  }, [])

  const setContent: Dispatch<SetStateAction<PortfolioContent>> = (action) => {
    const current = contentRef.current
    const next = typeof action === 'function' ? action(current) : action
    if (next === current || JSON.stringify(next) === JSON.stringify(current)) return

    historyRef.current = [...historyRef.current.slice(-49), cloneContent(current)]
    contentRef.current = next
    setUndoDepth(historyRef.current.length)
    setContentState(next)
    setMessage('')
  }

  const undo = () => {
    const previous = historyRef.current.pop()
    if (!previous) return

    contentRef.current = previous
    setContentState(previous)
    setUndoDepth(historyRef.current.length)
    setMessage('Último cambio deshecho.')
  }

  const save = async () => {
    setSaving(true)
    setMessage('Guardando...')

    try {
      const removedPaths = getRemovedMediaPaths(persistedContentRef.current, content)
      await saveStoredContent(content, removedPaths)
      persistedContentRef.current = cloneContent(content)
      setMessage('Cambios guardados en Supabase.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  const setText = (path: ContentPath, value: string) => {
    setContent((current) => setContentValue(current, path, value))
    setMessage('')
  }

  const editor: PortfolioEditor = {
    isEditing: true,
    setText,
    setContent,
  }

  return { content, editor, save, undo, canUndo: undoDepth > 0, message, saving }
}

function EditableText({ value, path, editor, className, style, as = 'span' }: EditableTextProps) {
  if (!editor?.isEditing) {
    const Tag = as
    return <Tag className={className} style={style}>{value}</Tag>
  }

  const Tag = as

  return (
    <Tag
      className={`admin-editable-text${className ? ` ${className}` : ''}`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onClick={(event) => event.stopPropagation()}
      onBlur={(event) => editor.setText(path, event.currentTarget.textContent ?? '')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && as === 'span') {
          event.preventDefault()
          ;(event.currentTarget as HTMLElement).blur()
        }
      }}
    >
      {value}
    </Tag>
  )
}

function setContentValue(content: PortfolioContent, path: ContentPath, value: string): PortfolioContent {
  const next = cloneContent(content)
  let cursor: any = next

  path.slice(0, -1).forEach((segment) => {
    cursor = cursor[segment]
  })

  cursor[path[path.length - 1]] = value
  return next
}

function updateContentValue<T>(content: PortfolioContent, path: ContentPath, updater: (value: T) => T): PortfolioContent {
  const next = cloneContent(content)
  let cursor: any = next

  path.slice(0, -1).forEach((segment) => {
    cursor = cursor[segment]
  })

  const key = path[path.length - 1]
  cursor[key] = updater(cursor[key])
  return next
}

// ─── Decorative SVG Icons ─────────────────────────────────────────────────────

function Sparkle({ size = 14, className = '', ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor" className={className} {...props}>
      <path d="M7 0 L8.2 5.8 L14 7 L8.2 8.2 L7 14 L5.8 8.2 L0 7 L5.8 5.8 Z" />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconMapPin() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function IconInstagram({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconTikTok({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.29a8.16 8.16 0 004.77 1.52V7.36a4.85 4.85 0 01-1-.67z" />
    </svg>
  )
}

function IconWhatsApp({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function IconEmail({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function getContactIcon(icon: ContactIcon, size?: number) {
  switch (icon) {
    case 'whatsapp':
      return <IconWhatsApp size={size ?? 22} />
    case 'email':
      return <IconEmail size={size ?? 18} />
    case 'instagram':
      return <IconInstagram size={size ?? 18} />
    case 'tiktok':
      return <IconTikTok size={size ?? 18} />
    case 'map':
      return <IconMapPin />
  }
}

function getLargePosterSrc(src: string) {
  return src.includes('w=300&h=540') ? src.replace('w=300&h=540', 'w=640&h=1136') : src
}

function Navbar({ content, editor }: { content: PortfolioContent['nav']; editor?: PortfolioEditor }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = content.links

  return (
    <nav
      data-gsap="navbar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: scrolled ? 'rgba(33,7,13,0.92)' : '#21070D',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: '1px solid rgba(195,163,106,0.2)',
        transition: 'background-color 0.4s ease, backdrop-filter 0.4s ease',
      }}
    >
      <div className="nav-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        {/* Logo */}
        <a href="#inicio" style={{ textDecoration: 'none' }} data-gsap="nav-logo" onClick={(event) => editor?.isEditing && event.preventDefault()}>
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#FAF7F2', lineHeight: 1.1, letterSpacing: '0.08em' }}>
            <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.7, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
              <EditableText value={content.logoEyebrow} path={['nav', 'logoEyebrow']} editor={editor} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              <EditableText value={content.logoName} path={['nav', 'logoName']} editor={editor} />
            </div>
          </div>
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }} className="hidden md:flex nav-links">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(event) => editor?.isEditing && event.preventDefault()}
              data-gsap="nav-item"
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(245,240,233,0.75)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#C3A36A')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(245,240,233,0.75)')}
            >
              <EditableText value={l.label} path={['nav', 'links', i, 'label']} editor={editor} />
            </a>
          ))}
        </div>

        {/* CTA button + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="#contacto"
            onClick={(event) => editor?.isEditing && event.preventDefault()}
            data-gsap="nav-item"
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#F5F0E9',
              border: '1px solid rgba(245,240,233,0.4)',
              padding: '9px 18px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            className="hidden sm:inline-block nav-desktop-cta"
            onMouseEnter={(e) => {
              const el = e.target as HTMLElement
              el.style.borderColor = '#C3A36A'
              el.style.color = '#C3A36A'
            }}
            onMouseLeave={(e) => {
              const el = e.target as HTMLElement
              el.style.borderColor = 'rgba(245,240,233,0.4)'
              el.style.color = '#F5F0E9'
            }}
          >
            <EditableText value={content.cta} path={['nav', 'cta']} editor={editor} />
          </a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            data-gsap="nav-item"
            style={{ background: 'none', border: 'none', color: '#F5F0E9', cursor: 'pointer', padding: 4 }}
            className="md:hidden nav-menu-toggle"
            aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ backgroundColor: '#21070D', borderTop: '1px solid rgba(195,163,106,0.15)', padding: '20px 24px 24px' }} className="md:hidden mobile-menu-panel">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(event) => {
                if (editor?.isEditing) event.preventDefault()
                setMenuOpen(false)
              }}
              style={{
                display: 'block',
                fontFamily: 'Manrope, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#F5F0E9',
                textDecoration: 'none',
                padding: '12px 0',
                borderBottom: '1px solid rgba(245,240,233,0.08)',
              }}
            >
              <EditableText value={l.label} path={['nav', 'links', i, 'label']} editor={editor} />
            </a>
          ))}
          <a
            href="#contacto"
            onClick={(event) => {
              if (editor?.isEditing) event.preventDefault()
              setMenuOpen(false)
            }}
            style={{
              display: 'block',
              marginTop: 16,
              fontFamily: 'Manrope, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#F5F0E9',
              border: '1px solid rgba(245,240,233,0.4)',
              padding: '12px 20px',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            <EditableText value={content.cta} path={['nav', 'cta']} editor={editor} />
          </a>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection({ content, editor }: { content: PortfolioContent['hero']; editor?: PortfolioEditor }) {
  return (
    <section
      id="inicio"
      style={{
        background: 'linear-gradient(135deg, #21070D 0%, #4D0715 50%, #3a0710 100%)',
        minHeight: '100vh',
        paddingTop: 72,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative sparkles */}
      <Sparkle size={10} className="sparkle hero-sparkle hero-sparkle-one" data-gsap="sparkle" data-gsap-float="true" style={{ position: 'absolute', top: 120, left: 80, color: '#C3A36A', opacity: 0.7 }} />
      <Sparkle size={7} className="sparkle-delay hero-sparkle hero-sparkle-two" data-gsap="sparkle" style={{ position: 'absolute', top: 200, left: 200, color: '#C3A36A', opacity: 0.5 }} />
      <Sparkle size={14} className="sparkle hero-sparkle hero-sparkle-three" data-gsap="sparkle" data-gsap-float="true" style={{ position: 'absolute', top: 160, right: 120, color: '#D7AAA8', opacity: 0.6 }} />
      <Sparkle size={8} className="sparkle-delay hero-sparkle hero-sparkle-four" data-gsap="sparkle" style={{ position: 'absolute', bottom: 200, left: 60, color: '#C3A36A', opacity: 0.4 }} />
      <Sparkle size={6} className="sparkle hero-sparkle hero-sparkle-five" data-gsap="sparkle" data-gsap-float="true" style={{ position: 'absolute', top: 300, right: 340, color: '#C3A36A', opacity: 0.5 }} />

      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 30% 40%, rgba(119,24,43,0.3) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="hero-grid">
        {/* Left column */}
        <div className="hero-copy" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C3A36A', marginBottom: 24,
            border: '1px solid rgba(195,163,106,0.35)', padding: '6px 14px',
          }} data-gsap="hero-eyebrow">
            <Sparkle size={8} />
            <EditableText value={content.eyebrow} path={['hero', 'eyebrow']} editor={editor} />
          </div>

          <h1 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(48px, 6vw, 80px)',
            fontWeight: 600,
            color: '#FAF7F2',
            lineHeight: 1.05,
            marginBottom: 28,
            letterSpacing: '-0.01em',
          }}>
            {content.titleLines.map((line, index) => (
              <span key={`${line}-${index}`} style={{ display: 'block', overflow: 'hidden' }}>
                <span
                  data-gsap="hero-title-line"
                  style={{
                    display: 'block',
                    ...(index === content.titleLines.length - 1 ? { color: '#D7AAA8', fontStyle: 'italic' } : {}),
                  }}
                >
                  <EditableText value={line} path={['hero', 'titleLines', index]} editor={editor} />
                </span>
              </span>
            ))}
          </h1>

          <p style={{
            fontFamily: 'Manrope, sans-serif',
            fontSize: 15,
            fontWeight: 400,
            lineHeight: 1.75,
            color: 'rgba(245,240,233,0.72)',
            marginBottom: 40,
            maxWidth: 440,
          }} data-gsap="hero-description">
            <EditableText value={content.description} path={['hero', 'description']} editor={editor} />
          </p>

          <div className="hero-actions" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
            <a
              href="#portfolio"
              onClick={(event) => editor?.isEditing && event.preventDefault()}
              data-gsap="hero-action"
              style={{
                fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                backgroundColor: '#FAF7F2', color: '#21070D',
                padding: '14px 28px', textDecoration: 'none',
                transition: 'all 0.25s',
              }}
              onMouseEnter={(e) => { const el = e.target as HTMLElement; el.style.backgroundColor = '#C3A36A' }}
              onMouseLeave={(e) => { const el = e.target as HTMLElement; el.style.backgroundColor = '#FAF7F2' }}
            >
              <EditableText value={content.primaryCta} path={['hero', 'primaryCta']} editor={editor} />
            </a>
            <a
              href="#contacto"
              onClick={(event) => editor?.isEditing && event.preventDefault()}
              data-gsap="hero-action"
              style={{
                fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                backgroundColor: 'transparent', color: '#FAF7F2',
                border: '1px solid rgba(245,240,233,0.4)',
                padding: '14px 28px', textDecoration: 'none',
                transition: 'all 0.25s',
              }}
              onMouseEnter={(e) => { const el = e.target as HTMLElement; el.style.borderColor = '#C3A36A'; el.style.color = '#C3A36A' }}
              onMouseLeave={(e) => { const el = e.target as HTMLElement; el.style.borderColor = 'rgba(245,240,233,0.4)'; el.style.color = '#FAF7F2' }}
            >
              <EditableText value={content.secondaryCta} path={['hero', 'secondaryCta']} editor={editor} />
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(245,240,233,0.5)', marginBottom: 40 }} data-gsap="hero-meta">
            <IconMapPin />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, letterSpacing: '0.05em' }}>
              <EditableText value={content.location} path={['hero', 'location']} editor={editor} />
            </span>
          </div>

          <div className="hero-categories" style={{
            display: 'flex', gap: 0, alignItems: 'center',
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(245,240,233,0.45)',
          }} data-gsap="hero-meta">
            {content.categories.map((cat, i) => (
              <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {i > 0 && <span style={{ margin: '0 12px', opacity: 0.4 }}>·</span>}
                <EditableText value={cat} path={['hero', 'categories', i]} editor={editor} />
              </span>
            ))}
          </div>
        </div>

        {/* Right column — photos */}
        <div className="hero-photo-stage" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 520 }}>
          {/* Main photo */}
          <div className="hero-main-photo" style={{
            width: 280, height: 400,
            borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
            overflow: 'hidden',
            position: 'relative', zIndex: 3,
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            backgroundColor: '#c8a882',
          }} data-gsap="hero-image">
            <img
              src={content.mainImage.src}
              alt={content.mainImage.alt}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Oval border decoration */}
          <div className="hero-oval-border" style={{
            position: 'absolute', width: 310, height: 430, zIndex: 2,
            borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
            border: '1px solid rgba(195,163,106,0.4)',
            transform: 'translate(16px, 12px)',
          }} />

          {/* Top-right oval: product */}
          <div className="hero-side-card hero-card-top" style={{
            position: 'absolute', top: 20, right: 20,
            width: 110, height: 130,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(215,170,168,0.5)',
            backgroundColor: '#d4b896', zIndex: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }} data-gsap="hero-card">
            <img
              src={content.sideImages[0]?.src}
              alt={content.sideImages[0]?.alt ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Bottom-left oval: jar */}
          <div className="hero-side-card hero-card-bottom" style={{
            position: 'absolute', bottom: 30, left: 10,
            width: 95, height: 115,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(195,163,106,0.4)',
            backgroundColor: '#c8b89a', zIndex: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }} data-gsap="hero-card">
            <img
              src={content.sideImages[1]?.src}
              alt={content.sideImages[1]?.alt ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Thin line decoration */}
          <div className="hero-line-decoration" style={{
            position: 'absolute', top: 60, left: 30, right: 30, bottom: 60,
            borderRadius: '50%',
            border: '1px solid rgba(195,163,106,0.15)',
            zIndex: 1,
          }} />

          {/* Gold sparkles near photo */}
          <Sparkle size={10} className="sparkle hero-photo-sparkle" data-gsap="sparkle" style={{ position: 'absolute', top: 80, left: 55, color: '#C3A36A', zIndex: 5 }} />
          <Sparkle size={7} className="sparkle-delay hero-photo-sparkle" data-gsap="sparkle" style={{ position: 'absolute', bottom: 90, right: 40, color: '#D7AAA8', zIndex: 5 }} />
        </div>
      </div>

      {/* Mobile grid override */}
      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  )
}

// ─── Brands ───────────────────────────────────────────────────────────────────

function BrandsSection({ content, editor }: { content: PortfolioContent['brands']; editor?: PortfolioEditor }) {
  const brands = content.items

  return (
    <section id="marcas" style={{ backgroundColor: '#F5F0E9', padding: '72px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C3A36A', marginBottom: 16,
          }}>
            <EditableText value={content.eyebrow} path={['brands', 'eyebrow']} editor={editor} />
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 600,
            color: '#1B1013', marginBottom: 16, lineHeight: 1.1,
          }}>
            <EditableText value={content.titleLine} path={['brands', 'titleLine']} editor={editor} /><br />
            <em style={{ fontStyle: 'italic', color: '#4D0715' }}>
              <EditableText value={content.titleAccent} path={['brands', 'titleAccent']} editor={editor} />
            </em>
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 14, lineHeight: 1.75,
            color: 'rgba(27,16,19,0.65)', maxWidth: 520, margin: '0 auto',
          }}>
            <EditableText value={content.description} path={['brands', 'description']} editor={editor} />
          </p>
        </div>

        {/* Logo row */}
        <div className="brands-row" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 0, flexWrap: 'wrap',
          borderTop: '1px solid rgba(77,7,21,0.12)',
          borderBottom: '1px solid rgba(77,7,21,0.12)',
          padding: '28px 0',
        }}>
          {brands.map((brand, i) => (
            <div key={brand} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && (
                <div style={{ width: 1, height: 32, backgroundColor: 'rgba(77,7,21,0.2)', margin: '0 32px' }} />
              )}
              <span style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 20, fontWeight: 600, letterSpacing: '0.06em',
                color: '#4D0715', opacity: 0.75,
                transition: 'opacity 0.2s',
                cursor: 'default',
                whiteSpace: 'nowrap',
              }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = '1')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = '0.75')}
              >
                <EditableText value={brand} path={['brands', 'items', i]} editor={editor} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── About ────────────────────────────────────────────────────────────────────

function AboutSection({ content, editor }: { content: PortfolioContent['about']; editor?: PortfolioEditor }) {
  const attrs = content.attributes

  return (
    <section id="sobre-mi" style={{ backgroundColor: '#FAF7F2', padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Diagonal bg shape */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '40%', height: '100%',
        background: 'linear-gradient(135deg, transparent 0%, rgba(77,7,21,0.04) 100%)',
        clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'minmax(0, 760px)', gap: 80, alignItems: 'center',
      }} className="about-grid">
        {/* Left */}
        <div>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C3A36A', marginBottom: 20,
          }}>
            <EditableText value={content.eyebrow} path={['about', 'eyebrow']} editor={editor} />
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 600,
            color: '#1B1013', marginBottom: 32, lineHeight: 1.05,
          }}>
            <EditableText value={content.titlePrefix} path={['about', 'titlePrefix']} editor={editor} />{' '}
            <em style={{ color: '#4D0715', fontStyle: 'italic' }}>
              <EditableText value={content.titleAccent} path={['about', 'titleAccent']} editor={editor} />
            </em>
          </h2>

          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, lineHeight: 1.85, color: 'rgba(27,16,19,0.72)' }}>
            {content.paragraphs.map((paragraph, index) => (
              <p key={`${paragraph}-${index}`} style={{ marginBottom: index < content.paragraphs.length - 1 ? 16 : 0 }}>
                <EditableText value={paragraph} path={['about', 'paragraphs', index]} editor={editor} />
              </p>
            ))}
          </div>

          <div className="about-attributes" style={{ display: 'flex', gap: 32, marginTop: 40 }}>
            {attrs.map((a, i) => (
              <div key={a.label} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  border: '1px solid rgba(77,7,21,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                  color: '#4D0715', fontSize: 16,
                }}>
                  {a.icon}
                </div>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4D0715',
                }}>
                  <EditableText value={a.label} path={['about', 'attributes', i, 'label']} editor={editor} />
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
        }
      `}</style>
    </section>
  )
}

// ─── Content Formats ──────────────────────────────────────────────────────────

function ContentFormatsSection({ content, editor }: { content: PortfolioContent['formats']; editor?: PortfolioEditor }) {
  const formats = content.items

  return (
    <section id="formatos" style={{ backgroundColor: '#F5F0E9', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C3A36A', marginBottom: 16,
          }}>
            <EditableText value={content.eyebrow} path={['formats', 'eyebrow']} editor={editor} />
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 600,
            color: '#1B1013', lineHeight: 1.1,
          }}>
            <EditableText value={content.titleLine} path={['formats', 'titleLine']} editor={editor} /><br />
            <em style={{ color: '#4D0715', fontStyle: 'italic' }}>
              <EditableText value={content.titleAccent} path={['formats', 'titleAccent']} editor={editor} />
            </em>
          </h2>
        </div>

        <div className="formats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          borderTop: '1px solid rgba(77,7,21,0.15)',
        }}>
          {formats.map((f, i) => (
            <div
              className="format-card"
              key={f.title}
              style={{
                padding: '36px 28px',
                borderRight: i < formats.length - 1 ? '1px solid rgba(77,7,21,0.15)' : 'none',
                borderBottom: '1px solid rgba(77,7,21,0.15)',
                transition: 'background-color 0.25s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(245,240,233,0.06)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                border: '1px solid rgba(77,7,21,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, fontSize: 18,
                color: '#4D0715',
              }}>
                {f.icon}
              </div>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 20, fontWeight: 600, color: '#1B1013',
                marginBottom: 10, lineHeight: 1.2,
              }}>
                <EditableText value={f.title} path={['formats', 'items', i, 'title']} editor={editor} />
              </h3>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: 12.5, lineHeight: 1.7,
                color: 'rgba(27,16,19,0.6)',
              }}>
                <EditableText value={f.desc} path={['formats', 'items', i, 'desc']} editor={editor} />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Video Portfolio ──────────────────────────────────────────────────────────

function VideoPortfolioSection({ content, editor }: { content: PortfolioContent['videos']; editor?: PortfolioEditor }) {
  const videos = editor?.isEditing ? content.items : content.items.filter((video) => !video.hidden)
  const filters = Array.from(new Set([...content.filters, ...videos.map((video) => video.cat)])).filter(Boolean)
  const [active, setActive] = useState('Todos')
  const [modalVideo, setModalVideo] = useState<VideoItem | null>(null)
  const [editorModalVideo, setEditorModalVideo] = useState<VideoItem | 'new' | null>(null)

  const filtered = active === 'Todos' ? videos : videos.filter((v) => v.cat === active)

  const updateVideos = (updater: (items: VideoItem[]) => VideoItem[]) => {
    editor?.setContent((current) => updateContentValue<VideoItem[]>(current, ['videos', 'items'], updater))
  }

  const moveVideo = (id: string, direction: -1 | 1) => {
    updateVideos((items) => {
      const index = items.findIndex((video) => video.id === id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items

      const next = [...items]
      const [video] = next.splice(index, 1)
      next.splice(nextIndex, 0, video)
      return next
    })
  }

  const toggleHidden = (id: string) => {
    updateVideos((items) => items.map((video) => video.id === id ? { ...video, hidden: !video.hidden } : video))
  }

  const deleteVideo = async (video: VideoItem) => {
    if (!window.confirm(`¿Eliminar "${video.title}"?`)) return
    updateVideos((items) => items.filter((item) => item.id !== video.id))
  }

  const saveVideo = async (video: VideoItem, file?: File, posterFile?: File, onUploadProgress?: (percent: number) => void) => {
    const nextVideo = { ...video }
    const [videoUpload, posterUpload] = await Promise.all([
      file ? uploadPortfolioMedia(file, 'video', video.id, onUploadProgress) : Promise.resolve(null),
      posterFile ? uploadPortfolioMedia(posterFile, 'cover', video.id) : Promise.resolve(null),
    ])

    if (videoUpload) {
      nextVideo.storageKey = videoUpload.path
      nextVideo.videoSrc = videoUpload.publicUrl
    }

    if (posterUpload) {
      nextVideo.posterStorageKey = posterUpload.path
      nextVideo.img = posterUpload.publicUrl
    }

    editor?.setContent((current) => {
      let next = updateContentValue<VideoItem[]>(current, ['videos', 'items'], (items) => {
        const exists = items.some((item) => item.id === nextVideo.id)
        return exists ? items.map((item) => item.id === nextVideo.id ? nextVideo : item) : [nextVideo, ...items]
      })

      if (!next.videos.filters.includes(nextVideo.cat)) {
        next = updateContentValue<string[]>(next, ['videos', 'filters'], (items) => [...items, nextVideo.cat])
      }

      return next
    })
  }

  return (
    <section id="portfolio" style={{ backgroundColor: '#21070D', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 600,
            color: '#FAF7F2', lineHeight: 1.1, marginBottom: 40,
          }}>
            <EditableText value={content.titlePrefix} path={['videos', 'titlePrefix']} editor={editor} />{' '}
            <em style={{ color: '#D7AAA8', fontStyle: 'italic' }}>
              <EditableText value={content.titleAccent} path={['videos', 'titleAccent']} editor={editor} />
            </em>
          </h2>

          <div className="portfolio-filters" style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {filters.map((f, i) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '8px 20px', cursor: 'pointer',
                  border: '1px solid',
                  borderColor: active === f ? '#C3A36A' : 'rgba(245,240,233,0.25)',
                  backgroundColor: active === f ? '#C3A36A' : 'transparent',
                  color: active === f ? '#21070D' : 'rgba(245,240,233,0.6)',
                  transition: 'all 0.2s',
                }}
              >
                <EditableText value={f} path={['videos', 'filters', Math.max(0, content.filters.indexOf(f, i))]} editor={content.filters.includes(f) ? editor : undefined} />
              </button>
            ))}
          </div>
        </div>

        <div className="video-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 20,
          justifyItems: 'center',
        }}>
          {editor?.isEditing && (
            <button type="button" className="admin-add-video-card" onClick={() => setEditorModalVideo('new')}>
              <span>+</span>
              Añadir video
            </button>
          )}

          {filtered.map((v) => (
            <div
              className={`video-card${v.hidden ? ' admin-hidden-video' : ''}`}
              key={v.id}
              onClick={() => !editor?.isEditing && setModalVideo(v)}
              style={{
                width: 140, cursor: editor?.isEditing ? 'default' : 'pointer',
                transition: 'transform 0.25s',
              }}
              onMouseEnter={(e) => {
                if (!editor?.isEditing) (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'
              }}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
            >
              <div className="phone-frame" style={{
                width: 140, height: 252,
                borderRadius: 24,
                border: '2px solid rgba(255,255,255,0.18)',
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#1B1013',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 48, height: 8, backgroundColor: '#000',
                  borderRadius: '0 0 8px 8px', zIndex: 10,
                }} />
                <img src={v.img} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, transparent 40%, rgba(33,7,13,0.85) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    backgroundColor: 'rgba(77,7,21,0.85)',
                    border: '1.5px solid rgba(195,163,106,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconPlay />
                  </div>
                </div>
                {v.hidden && <div className="admin-hidden-badge">Oculto</div>}
              </div>
              <div style={{ padding: '10px 4px' }}>
                <div style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: '#C3A36A', marginBottom: 4,
                }}>
                  {v.brand}
                </div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  fontSize: 13, fontWeight: 600, color: '#FAF7F2', lineHeight: 1.3,
                  marginBottom: 4,
                }}>
                  {v.title}
                </div>
                <div style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: 9,
                  color: 'rgba(245,240,233,0.4)', letterSpacing: '0.06em',
                }}>
                  {v.cat}
                </div>
              </div>

              {editor?.isEditing && (
                <div className="admin-video-card-actions" onClick={(event) => event.stopPropagation()}>
                  <button type="button" onClick={() => moveVideo(v.id, -1)} aria-label="Mover antes">←</button>
                  <button type="button" onClick={() => moveVideo(v.id, 1)} aria-label="Mover después">→</button>
                  <button type="button" onClick={() => setEditorModalVideo(v)}>Editar</button>
                  <button type="button" onClick={() => toggleHidden(v.id)}>{v.hidden ? 'Mostrar' : 'Ocultar'}</button>
                  <button type="button" onClick={() => void deleteVideo(v)}>Eliminar</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <a
            href="#contacto"
            className="video-modal"
            onClick={(event) => editor?.isEditing && event.preventDefault()}
            style={{
              fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: '#FAF7F2', border: '1px solid rgba(245,240,233,0.35)',
              padding: '14px 36px', textDecoration: 'none', transition: 'all 0.25s',
              display: 'inline-block',
            }}
            onMouseEnter={(e) => { const el = e.target as HTMLElement; el.style.borderColor = '#C3A36A'; el.style.color = '#C3A36A' }}
            onMouseLeave={(e) => { const el = e.target as HTMLElement; el.style.borderColor = 'rgba(245,240,233,0.35)'; el.style.color = '#FAF7F2' }}
          >
            <EditableText value={content.cta} path={['videos', 'cta']} editor={editor} />
          </a>
        </div>
      </div>

      {modalVideo && (
        <VideoPreviewModal video={modalVideo} onClose={() => setModalVideo(null)} />
      )}

      {editor?.isEditing && editorModalVideo && (
        <VideoEditorModal
          video={editorModalVideo === 'new' ? null : editorModalVideo}
          categories={filters.filter((filter) => filter !== 'Todos')}
          onClose={() => setEditorModalVideo(null)}
          onSave={async (video, file, posterFile, onUploadProgress) => {
            await saveVideo(video, file, posterFile, onUploadProgress)
            setEditorModalVideo(null)
          }}
        />
      )}
    </section>
  )
}

// ─── Services & Process ───────────────────────────────────────────────────────

function VideoPreviewModal({ video, onClose }: { video: VideoItem; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: 320,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
            width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Cerrar video"
        >
          <IconClose />
        </button>
        {video.videoSrc ? (
          <video
            src={video.videoSrc}
            poster={video.img}
            controls
            autoPlay
            playsInline
            style={{ width: '100%', display: 'block', backgroundColor: '#000' }}
          />
        ) : (
          <img
            src={getLargePosterSrc(video.img)}
            alt={video.title}
            style={{ width: '100%', display: 'block' }}
          />
        )}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(33,7,13,0.95))',
          padding: '40px 24px 28px',
        }}>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, color: '#C3A36A', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
            {video.brand}
          </div>
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 20, fontWeight: 600, color: '#FAF7F2' }}>
            {video.title}
          </div>
        </div>
      </div>
    </div>
  )
}

function VideoEditorModal({
  video,
  categories,
  onClose,
  onSave,
}: {
  video: VideoItem | null
  categories: string[]
  onClose: () => void
  onSave: (video: VideoItem, file?: File, posterFile?: File, onUploadProgress?: (percent: number) => void) => Promise<void>
}) {
  const [draft, setDraft] = useState<VideoItem>(() => video ?? {
    id: createVideoId(),
    brand: '',
    title: '',
    cat: categories[0] ?? 'Skincare',
    img: '',
  })
  const [videoFile, setVideoFile] = useState<File | undefined>()
  const [coverFile, setCoverFile] = useState<File | undefined>()
  const [coverPreview, setCoverPreview] = useState(draft.img)
  const [selectedVideoLabel, setSelectedVideoLabel] = useState('')
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [videoStatus, setVideoStatus] = useState('')

  useEffect(() => {
    return () => {
      if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
    }
  }, [coverPreview])

  const handleVideoFile = async (file?: File) => {
    if (file && file.size > MAX_SOURCE_VIDEO_BYTES) {
      setVideoFile(undefined)
      setSelectedVideoLabel('')
      setError('El video supera el máximo permitido de 100 MB.')
      return
    }

    setVideoFile(file)
    setSelectedVideoLabel(file ? `${file.name} · ${formatMegabytes(file.size)}` : '')
    setError('')
    if (!file || coverFile) return

    try {
      const poster = await captureVideoPoster(file)
      setCoverPreview(poster)
      setDraft((current) => ({ ...current, img: poster }))
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    } catch {
      setError('No pude leer la portada automática del video.')
    }
  }

  const handleCoverFile = (file?: File) => {
    setCoverFile(file)
    setError('')
    if (!file) return

    if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
    setCoverPreview(URL.createObjectURL(file))
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const handleSubmit = async () => {
    setError('')
    const brand = draft.brand.trim()
    const title = draft.title.trim()
    const cat = draft.cat.trim()

    if (!brand || !title || !cat) {
      setError('Completá marca, título y categoría.')
      return
    }

    if (!video && !videoFile) {
      setError('Seleccioná un video.')
      return
    }

    setBusy(true)
    setVideoStatus('')

    try {
      let preparedVideoFile = videoFile
      if (videoFile) {
        const { prepareVideoForUpload } = await import('./videoCompression')
        preparedVideoFile = await prepareVideoForUpload(videoFile, ({ phase, percent }) => {
          setVideoStatus(phase === 'loading'
            ? 'Cargando compresor...'
            : `Comprimiendo video... ${percent}%`)
        })
        setVideoFile(preparedVideoFile)
        setSelectedVideoLabel(`${preparedVideoFile.name} · ${formatMegabytes(preparedVideoFile.size)}`)
      }

      let img = draft.img
      if ((coverFile || videoFile) && coverPreview) {
        if (!croppedAreaPixels) throw new Error('La portada todavía se está preparando.')
        img = await cropImageToPortrait(coverPreview, croppedAreaPixels)
      } else if (!img && videoFile) {
        img = await captureVideoPoster(videoFile)
      }

      const posterFile = img.startsWith('data:')
        ? await dataUrlToFile(img, `${draft.id}-cover.jpg`)
        : undefined

      if (preparedVideoFile) setVideoStatus('Subiendo video... 0%')
      await onSave(
        { ...draft, brand, title, cat, img },
        preparedVideoFile,
        posterFile,
        preparedVideoFile ? (percent) => setVideoStatus(`Subiendo video... ${percent}%`) : undefined,
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo guardar el video.')
    } finally {
      setBusy(false)
      setVideoStatus('')
    }
  }

  return (
    <div className="admin-video-modal" onClick={onClose}>
      <div className="admin-video-modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="admin-video-modal-header">
          <div>
            <p className="admin-kicker">Portfolio</p>
            <h2>{video ? 'Editar video' : 'Añadir video'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            <IconClose />
          </button>
        </div>

        <div className="admin-video-modal-grid">
          <div className="admin-video-form">
            <label>
              Marca
              <input value={draft.brand} onChange={(event) => setDraft({ ...draft, brand: event.target.value })} />
            </label>
            <label>
              Título
              <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </label>
            <label>
              Categoría
              <input list="admin-video-categories" value={draft.cat} onChange={(event) => setDraft({ ...draft, cat: event.target.value })} />
              <datalist id="admin-video-categories">
                {categories.map((category) => <option value={category} key={category} />)}
              </datalist>
            </label>
            <label>
              Video
              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => void handleVideoFile(event.target.files?.[0])} />
              {selectedVideoLabel ? <span className="admin-selected-file">{selectedVideoLabel}</span> : null}
              <span className="admin-input-hint">
                Hasta 100 MB. Los archivos de más de {formatMegabytes(MAX_UPLOAD_VIDEO_BYTES)} se comprimen automáticamente.
              </span>
            </label>
            <label>
              Foto de portada
              <input type="file" accept="image/*" onChange={(event) => handleCoverFile(event.target.files?.[0])} />
            </label>
          </div>

          <div className="admin-cover-editor">
            <div className="admin-cover-frame">
              {coverPreview ? (
                <Suspense fallback={<span>Preparando...</span>}>
                  <CoverCropper
                    image={coverPreview}
                    crop={crop}
                    zoom={zoom}
                    minZoom={1}
                    maxZoom={4}
                    zoomSpeed={0.25}
                    aspect={5 / 9}
                    objectFit="cover"
                    showGrid
                    zoomWithScroll
                    restrictPosition
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
                    classes={{
                      containerClassName: 'admin-cover-cropper',
                      cropAreaClassName: 'admin-cover-crop-area',
                    }}
                  />
                </Suspense>
              ) : (
                <span>Portada</span>
              )}
            </div>
            <div className="admin-cover-zoom-control">
              <span aria-hidden="true">−</span>
              <label>
                <span className="admin-visually-hidden">Zoom</span>
                <input type="range" min="1" max="4" step="0.02" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              </label>
              <span aria-hidden="true">+</span>
              <output>{Math.round(zoom * 100)}%</output>
            </div>
            <button
              type="button"
              className="admin-cover-reset"
              disabled={!coverPreview}
              onClick={() => {
                setCrop({ x: 0, y: 0 })
                setZoom(1)
              }}
            >
              Centrar
            </button>
          </div>
        </div>

        {videoStatus ? <p className="admin-video-status" role="status">{videoStatus}</p> : null}
        {error && <p className="admin-error">{error}</p>}

        <div className="admin-video-modal-actions">
          <button type="button" className="admin-secondary-action" onClick={onClose}>Cancelar</button>
          <button type="button" onClick={() => void handleSubmit()} disabled={busy}>
            {busy ? 'Procesando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function createVideoId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function dataUrlToFile(dataUrl: string, fileName: string) {
  const response = await fetch(dataUrl)
  if (!response.ok) throw new Error('No se pudo preparar la portada.')
  const blob = await response.blob()
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' })
}

function captureVideoPoster(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')

    const cleanup = () => {
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
    }

    const fail = () => {
      cleanup()
      reject(new Error('Could not read video frame'))
    }

    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.onloadeddata = () => {
      try {
        const sourceWidth = video.videoWidth || 720
        const sourceHeight = video.videoHeight || 1280
        const scale = Math.min(540 / sourceWidth, 1)
        const width = Math.round(sourceWidth * scale)
        const height = Math.round(sourceHeight * scale)
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')

        if (!context) {
          fail()
          return
        }

        canvas.width = width
        canvas.height = height
        context.drawImage(video, 0, 0, width, height)
        const poster = canvas.toDataURL('image/jpeg', 0.86)
        cleanup()
        resolve(poster)
      } catch {
        fail()
      }
    }
    video.onerror = fail
    video.src = url
    video.load()
  })
}

function cropImageToPortrait(src: string, crop: Area): Promise<string> {
  return cropImageToSize(src, crop, 540, 972)
}

function cropImageToContact(src: string, crop: Area): Promise<string> {
  return cropImageToSize(src, crop, 700, 900)
}

function cropImageToSize(src: string, crop: Area, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) {
        reject(new Error('Could not crop cover'))
        return
      }

      canvas.width = width
      canvas.height = height
      context.drawImage(
        image,
        Math.max(0, crop.x),
        Math.max(0, crop.y),
        Math.min(crop.width, image.naturalWidth),
        Math.min(crop.height, image.naturalHeight),
        0,
        0,
        width,
        height,
      )
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    image.onerror = () => reject(new Error('Could not load cover'))
    image.src = src
  })
}

function ServicesSection({ content, editor }: { content: PortfolioContent['services']; editor?: PortfolioEditor }) {
  const pricingCards = content.pricingCards
  const processSteps = content.processSteps

  return (
    <section id="servicios" style={{ backgroundColor: '#FAF7F2', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C3A36A', marginBottom: 16,
          }}>
            <EditableText value={content.eyebrow} path={['services', 'eyebrow']} editor={editor} />
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 600,
            color: '#1B1013', lineHeight: 1.1, marginBottom: 64,
          }}>
            <EditableText value={content.titlePrefix} path={['services', 'titlePrefix']} editor={editor} />{' '}
            <em style={{ color: '#4D0715', fontStyle: 'italic' }}>
              <EditableText value={content.titleAccent} path={['services', 'titleAccent']} editor={editor} />
            </em>{' '}
            <EditableText value={content.titleSuffix} path={['services', 'titleSuffix']} editor={editor} />
          </h2>
        </div>

        <div className="pricing-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20, marginBottom: 32,
        }} id="tarifas">
          {pricingCards.map((card, cardIndex) => (
            <div
              className="pricing-card"
              key={card.title}
              style={{
                backgroundColor: '#F5F0E9',
                border: card.highlight ? '1.5px solid #4D0715' : '1px solid rgba(77,7,21,0.15)',
                borderRadius: 4,
                padding: '32px 28px',
                position: 'relative',
                transition: 'box-shadow 0.25s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(77,7,21,0.12)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
            >
              {card.highlight && (
                <div style={{
                  position: 'absolute', top: -1, left: 24,
                  fontFamily: 'Manrope, sans-serif', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  backgroundColor: '#4D0715', color: '#FAF7F2', padding: '4px 12px',
                }}>
                  <EditableText value={content.popularBadge} path={['services', 'popularBadge']} editor={editor} />
                </div>
              )}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                backgroundColor: '#4D0715',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <Sparkle size={12} style={{ color: '#FAF7F2' } as any} />
              </div>
              <h3 style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 22, fontWeight: 600, color: '#1B1013', marginBottom: 8,
              }}>
                <EditableText value={card.title} path={['services', 'pricingCards', cardIndex, 'title']} editor={editor} />
              </h3>
              <div style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 32, fontWeight: 700, color: '#4D0715', marginBottom: 24,
              }}>
                <EditableText value={card.price} path={['services', 'pricingCards', cardIndex, 'price']} editor={editor} />
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {card.items.map((item, itemIndex) => (
                  <li key={item} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    fontFamily: 'Manrope, sans-serif', fontSize: 12.5, lineHeight: 1.6,
                    color: 'rgba(27,16,19,0.7)', paddingBottom: 8,
                    borderBottom: '1px solid rgba(77,7,21,0.08)', marginBottom: 8,
                  }}>
                    <span style={{ color: '#C3A36A', marginTop: 2, flexShrink: 0 }}>✦</span>
                    <EditableText value={item} path={['services', 'pricingCards', cardIndex, 'items', itemIndex]} editor={editor} />
                  </li>
                ))}
              </ul>
              <a
                href="#contacto"
                onClick={(event) => editor?.isEditing && event.preventDefault()}
                style={{
                  display: 'block', marginTop: 24, textAlign: 'center',
                  fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  backgroundColor: card.highlight ? '#4D0715' : 'transparent',
                  color: card.highlight ? '#FAF7F2' : '#4D0715',
                  border: '1px solid #4D0715', padding: '12px 20px',
                  textDecoration: 'none', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { const el = e.target as HTMLElement; el.style.backgroundColor = '#4D0715'; el.style.color = '#FAF7F2' }}
                onMouseLeave={(e) => {
                  const el = e.target as HTMLElement
                  el.style.backgroundColor = card.highlight ? '#4D0715' : 'transparent'
                  el.style.color = card.highlight ? '#FAF7F2' : '#4D0715'
                }}
              >
                <EditableText value={content.requestCta} path={['services', 'requestCta']} editor={editor} />
              </a>
            </div>
          ))}
        </div>

        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: 11.5, lineHeight: 1.7,
          color: 'rgba(27,16,19,0.5)', textAlign: 'center', maxWidth: 640, margin: '0 auto 80px',
        }}>
          <EditableText value={content.pricingNote} path={['services', 'pricingNote']} editor={editor} />
        </p>

        {/* Process */}
        <div id="proceso">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#C3A36A', marginBottom: 16,
            }}>
              <EditableText value={content.processEyebrow} path={['services', 'processEyebrow']} editor={editor} />
            </div>
          </div>
          <div className="process-list" style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
            {/* Vertical line */}
            <div style={{
              position: 'absolute', left: 20, top: 40, bottom: 40,
              width: 1, borderLeft: '1.5px dashed rgba(77,7,21,0.25)',
            }} />
            {processSteps.map((step, i) => (
              <div key={step.num} style={{ display: 'flex', gap: 28, marginBottom: i < 3 ? 40 : 0, position: 'relative' }}>
                <div style={{
                  flexShrink: 0, width: 40, height: 40, borderRadius: '50%',
                  backgroundColor: '#4D0715', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 0 6px #FAF7F2',
                }}>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, color: '#FAF7F2' }}>
                    {step.num}
                  </span>
                </div>
                <div style={{ paddingTop: 8 }}>
                  <h4 style={{
                    fontFamily: 'Cormorant Garamond, Georgia, serif',
                    fontSize: 22, fontWeight: 600, color: '#1B1013', marginBottom: 6,
                  }}>
                    <EditableText value={step.title} path={['services', 'processSteps', i, 'title']} editor={editor} />
                  </h4>
                  <p style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: 13, lineHeight: 1.7,
                    color: 'rgba(27,16,19,0.6)',
                  }}>
                    <EditableText value={step.desc} path={['services', 'processSteps', i, 'desc']} editor={editor} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialsSection({ content, editor }: { content: PortfolioContent['testimonials']; editor?: PortfolioEditor }) {
  const stats = content.stats

  return (
    <section id="resultados" style={{ backgroundColor: '#F5F0E9', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C3A36A', marginBottom: 16,
          }}>
            <EditableText value={content.eyebrow} path={['testimonials', 'eyebrow']} editor={editor} />
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 600,
            color: '#1B1013', lineHeight: 1.1,
          }}>
            <EditableText value={content.titlePrefix} path={['testimonials', 'titlePrefix']} editor={editor} />{' '}
            <em style={{ color: '#4D0715', fontStyle: 'italic' }}>
              <EditableText value={content.titleAccent} path={['testimonials', 'titleAccent']} editor={editor} />
            </em>
          </h2>
        </div>

        {/* Stat cards */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
          {stats.map((s, i) => (
            <div
              className="stat-card"
              key={s.value}
              style={{
                backgroundColor: '#FAF7F2', border: '1px solid rgba(77,7,21,0.12)',
                padding: '36px 28px', borderRadius: 4,
              }}
            >
              <div style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 48, fontWeight: 700, color: '#4D0715', lineHeight: 1, marginBottom: 8,
              }}>
                <EditableText value={s.value} path={['testimonials', 'stats', i, 'value']} editor={editor} />
              </div>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#1B1013', marginBottom: 12,
              }}>
                <EditableText value={s.label} path={['testimonials', 'stats', i, 'label']} editor={editor} />
              </div>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: 13, lineHeight: 1.7,
                color: 'rgba(27,16,19,0.6)',
              }}>
                <EditableText value={s.desc} path={['testimonials', 'stats', i, 'desc']} editor={editor} />
              </p>
            </div>
          ))}
        </div>

        {/* Testimonial card */}
        <div className="testimonial-card" style={{
          backgroundColor: '#4D0715',
          padding: '48px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -20, left: -20, fontSize: 160,
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            color: 'rgba(255,255,255,0.05)', lineHeight: 1, userSelect: 'none',
          }}>
            "
          </div>
          <div style={{ position: 'relative', maxWidth: 680 }}>
            <p style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(22px, 3vw, 32px)', fontStyle: 'italic',
              color: '#FAF7F2', lineHeight: 1.5, marginBottom: 28,
            }}>
              <EditableText value={content.quote} path={['testimonials', 'quote']} editor={editor} />
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                backgroundColor: '#77182B', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, fontWeight: 600, color: '#FAF7F2',
              }}><EditableText value={content.authorInitial} path={['testimonials', 'authorInitial']} editor={editor} /></div>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, color: '#FAF7F2' }}>
                  <EditableText value={content.author} path={['testimonials', 'author']} editor={editor} />
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: 'rgba(245,240,233,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  <EditableText value={content.company} path={['testimonials', 'company']} editor={editor} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function ContactImageEditorModal({
  image,
  fileName,
  onClose,
  onApply,
}: {
  image: string
  fileName: string
  onClose: () => void
  onApply: (file: File) => Promise<void>
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleApply = async () => {
    if (!croppedAreaPixels) {
      setError('La imagen todavía se está preparando.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const croppedImage = await cropImageToContact(image, croppedAreaPixels)
      const baseName = fileName.replace(/\.[^.]+$/, '') || 'contacto'
      const croppedFile = await dataUrlToFile(croppedImage, `${baseName}-recortada.jpg`)
      await onApply(croppedFile)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo preparar la imagen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-video-modal" onClick={busy ? undefined : onClose}>
      <div className="admin-video-modal-card admin-contact-crop-modal" onClick={(event) => event.stopPropagation()}>
        <div className="admin-video-modal-header">
          <div>
            <p className="admin-kicker">Foto de contacto</p>
            <h2>Encuadrar foto</h2>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar">
            <IconClose />
          </button>
        </div>

        <div className="admin-contact-crop-body">
          <div className="admin-cover-editor">
            <div className="admin-cover-frame admin-contact-crop-frame">
              <Suspense fallback={<span>Preparando...</span>}>
                <CoverCropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  minZoom={1}
                  maxZoom={4}
                  zoomSpeed={0.25}
                  aspect={7 / 9}
                  cropShape="round"
                  objectFit="cover"
                  showGrid
                  zoomWithScroll
                  restrictPosition
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_area, pixels) => setCroppedAreaPixels(pixels)}
                  classes={{
                    containerClassName: 'admin-cover-cropper',
                    cropAreaClassName: 'admin-cover-crop-area admin-contact-crop-area',
                  }}
                />
              </Suspense>
            </div>
            <div className="admin-cover-zoom-control">
              <span aria-hidden="true">−</span>
              <label>
                <span className="admin-visually-hidden">Zoom</span>
                <input type="range" min="1" max="4" step="0.02" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              </label>
              <span aria-hidden="true">+</span>
              <output>{Math.round(zoom * 100)}%</output>
            </div>
            <button
              type="button"
              className="admin-cover-reset"
              onClick={() => {
                setCrop({ x: 0, y: 0 })
                setZoom(1)
              }}
            >
              Centrar
            </button>
          </div>
        </div>

        {error ? <p className="admin-error admin-contact-crop-error">{error}</p> : null}

        <div className="admin-video-modal-actions">
          <button type="button" className="admin-secondary-action" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="button" onClick={() => void handleApply()} disabled={busy}>
            {busy ? 'Subiendo...' : 'Aplicar foto'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ContactSection({ content, editor }: { content: PortfolioContent['contact']; editor?: PortfolioEditor }) {
  const contactImageInputRef = useRef<HTMLInputElement | null>(null)
  const [contactImageFile, setContactImageFile] = useState<File | null>(null)
  const [contactImagePreview, setContactImagePreview] = useState('')
  const [contactImageError, setContactImageError] = useState('')

  useEffect(() => {
    return () => {
      if (contactImagePreview.startsWith('blob:')) URL.revokeObjectURL(contactImagePreview)
    }
  }, [contactImagePreview])

  const closeContactImageEditor = () => {
    setContactImagePreview('')
    setContactImageFile(null)
    if (contactImageInputRef.current) contactImageInputRef.current.value = ''
  }

  const selectContactImage = (file?: File) => {
    if (!file || !editor?.isEditing) return
    if (!file.type.startsWith('image/')) {
      setContactImageError('Seleccioná un archivo de imagen.')
      if (contactImageInputRef.current) contactImageInputRef.current.value = ''
      return
    }

    setContactImageError('')
    setContactImageFile(file)
    setContactImagePreview(URL.createObjectURL(file))
  }

  const replaceContactImage = async (file: File) => {
    if (!editor?.isEditing) throw new Error('El editor no está disponible.')

    try {
      const uploaded = await uploadPortfolioMedia(file, 'contact', 'main')
      editor.setContent((current) => updateContentValue<ImageAsset>(current, ['contact', 'image'], (image) => ({
        ...image,
        src: uploaded.publicUrl,
        storageKey: uploaded.path,
      })))
      closeContactImageEditor()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'No se pudo subir la imagen.')
    }
  }

  return (
    <section id="contacto" style={{ backgroundColor: '#21070D', padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
      <Sparkle size={12} className="sparkle" style={{ position: 'absolute', top: 60, right: 80, color: '#C3A36A', opacity: 0.6 } as any} />
      <Sparkle size={8} className="sparkle-delay" style={{ position: 'absolute', bottom: 80, left: 60, color: '#D7AAA8', opacity: 0.5 } as any} />

      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 60, alignItems: 'center',
      }} className="contact-grid">
        {/* Left */}
        <div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 600,
            color: '#FAF7F2', lineHeight: 1.1, marginBottom: 24,
          }}>
            <EditableText value={content.titlePrefix} path={['contact', 'titlePrefix']} editor={editor} />{' '}
            <em style={{ color: '#D7AAA8', fontStyle: 'italic' }}>
              <EditableText value={content.titleAccent} path={['contact', 'titleAccent']} editor={editor} />
            </em>
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 14, lineHeight: 1.8,
            color: 'rgba(245,240,233,0.65)', marginBottom: 40,
          }}>
            <EditableText value={content.description} path={['contact', 'description']} editor={editor} />
          </p>
          <a
            href={content.emailHref}
            onClick={(event) => editor?.isEditing && event.preventDefault()}
            style={{
              display: 'inline-block',
              fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              backgroundColor: '#C3A36A', color: '#21070D',
              padding: '15px 32px', textDecoration: 'none',
              transition: 'all 0.25s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#FAF7F2')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = '#C3A36A')}
          >
            <EditableText value={content.cta} path={['contact', 'cta']} editor={editor} />
          </a>
        </div>

        {/* Center — oval photo */}
        <div className="contact-photo-wrap" style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div className="contact-photo" style={{
            width: 140, height: 180,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(195,163,106,0.4)',
            backgroundColor: '#c8a882',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          }}>
            <img
              src={content.image.src}
              alt={content.image.alt}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          {editor?.isEditing ? (
            <>
              <input
                ref={contactImageInputRef}
                className="admin-contact-image-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Seleccionar nueva foto de contacto"
                onChange={(event) => selectContactImage(event.target.files?.[0])}
              />
              <button
                type="button"
                className="admin-contact-image-button"
                onClick={() => contactImageInputRef.current?.click()}
              >
                <span aria-hidden="true">↑</span>
                Cambiar foto
              </button>
              {contactImageError ? <p className="admin-contact-image-error">{contactImageError}</p> : null}
              {contactImageFile && contactImagePreview ? (
                <ContactImageEditorModal
                  image={contactImagePreview}
                  fileName={contactImageFile.name}
                  onClose={closeContactImageEditor}
                  onApply={replaceContactImage}
                />
              ) : null}
            </>
          ) : null}
        </div>

        {/* Right — contact info */}
        <div>
          {content.info.map((item, i) => (
            <div
              key={item.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 0',
                borderBottom: '1px solid rgba(245,240,233,0.08)',
              }}
            >
              <div style={{ color: '#C3A36A', flexShrink: 0, width: 20, display: 'flex', alignItems: 'center' }}>
                {getContactIcon(item.icon)}
              </div>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,233,0.4)', marginBottom: 2 }}>
                  <EditableText value={item.label} path={['contact', 'info', i, 'label']} editor={editor} />
                </div>
                {item.href ? (
                  <a href={item.href} onClick={(event) => editor?.isEditing && event.preventDefault()} style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#FAF7F2', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#C3A36A')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#FAF7F2')}
                  >
                    <EditableText value={item.value} path={['contact', 'info', i, 'value']} editor={editor} />
                  </a>
                ) : (
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#FAF7F2' }}>
                    <EditableText value={item.value} path={['contact', 'info', i, 'value']} editor={editor} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
        }
      `}</style>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ content, editor }: { content: PortfolioContent['footer']; editor?: PortfolioEditor }) {
  return (
    <footer style={{
      backgroundColor: '#21070D',
      borderTop: '1px solid rgba(195,163,106,0.2)',
      padding: '36px 24px',
    }}>
      <div className="footer-inner" style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20,
      }}>
        {/* Monogram */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '1px solid rgba(195,163,106,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, fontWeight: 600, color: '#C3A36A' }}>
              <EditableText value={content.monogram} path={['footer', 'monogram']} editor={editor} />
            </span>
          </div>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 14, color: '#FAF7F2', letterSpacing: '0.1em' }}>
              <EditableText value={content.name} path={['footer', 'name']} editor={editor} />
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,233,0.4)' }}>
              <EditableText value={content.role} path={['footer', 'role']} editor={editor} />
            </div>
          </div>
        </div>

        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: 'rgba(245,240,233,0.35)' }}>
          © {new Date().getFullYear()} <EditableText value={content.copyrightName} path={['footer', 'copyrightName']} editor={editor} />. Todos los derechos reservados.
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {content.socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              onClick={(event) => editor?.isEditing && event.preventDefault()}
              aria-label={s.label}
              style={{ color: 'rgba(245,240,233,0.45)', transition: 'color 0.2s' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#C3A36A')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(245,240,233,0.45)')}
            >
              {getContactIcon(s.icon, 16)}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ─── WhatsApp Float ───────────────────────────────────────────────────────────

function WhatsAppButton({ href, disabled }: { href: string; disabled?: boolean }) {
  return (
    <a
      className="whatsapp-float"
      href={href}
      onClick={(event) => disabled && event.preventDefault()}
      aria-label="Contactar por WhatsApp"
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 150,
        width: 52, height: 52, borderRadius: '50%',
        backgroundColor: '#25D366',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(37,211,102,0.45)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        textDecoration: 'none', color: '#fff',
      }}
      onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = 'scale(1.1)'; el.style.boxShadow = '0 6px 28px rgba(37,211,102,0.6)' }}
      onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = 'scale(1)'; el.style.boxShadow = '0 4px 20px rgba(37,211,102,0.45)' }}
    >
      <IconWhatsApp size={24} />
    </a>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const isAdminPath = window.location.pathname.replace(/\/$/, '') === '/admin'

  if (isAdminPath) {
    return (
      <AdminPage>
        <AdminPortfolioApp />
      </AdminPage>
    )
  }

  return <PortfolioApp />
}

function PortfolioApp() {
  const content = usePortfolioContent()

  useEffect(() => {
    void recordPortfolioVisit()
  }, [])

  return <PortfolioCanvas content={content} />
}

function AdminPortfolioApp() {
  const { content, editor, save, undo, canUndo, message, saving } = useAdminPortfolioContent()

  return (
    <>
      <AdminEditToolbar onSave={save} onUndo={undo} canUndo={canUndo} message={message} saving={saving} />
      <PortfolioCanvas content={content} editor={editor} />
    </>
  )
}

function AdminEditToolbar({
  onSave,
  onUndo,
  canUndo,
  message,
  saving,
}: {
  onSave: () => Promise<void>
  onUndo: () => void
  canUndo: boolean
  message: string
  saving: boolean
}) {
  return (
    <div className="admin-edit-toolbar">
      {message ? <span>{message}</span> : null}
      <button type="button" className="admin-toolbar-secondary" onClick={onUndo} disabled={!canUndo || saving}>Retroceder</button>
      <a href="/" target="_blank" rel="noreferrer" className="admin-toolbar-secondary">Ver portfolio</a>
      <button type="button" onClick={() => void onSave()} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  )
}

function PortfolioCanvas({ content, editor }: { content: PortfolioContent; editor?: PortfolioEditor }) {
  const introRef = useRef<HTMLDivElement | null>(null)
  useHeroIntroAnimation(introRef)
  useScrollFrameBackground(introRef)

  return (
    <div ref={introRef} className={`animated-background-page${editor?.isEditing ? ' admin-edit-mode' : ''}`} style={{ minHeight: '100vh' }}>
      <Navbar content={content.nav} editor={editor} />
      <main>
        <div id="intro-sequence">
          <HeroSection content={content.hero} editor={editor} />
          <AboutSection content={content.about} editor={editor} />
          <BrandsSection content={content.brands} editor={editor} />
          <ContentFormatsSection content={content.formats} editor={editor} />
        </div>
        <VideoPortfolioSection content={content.videos} editor={editor} />
        <ServicesSection content={content.services} editor={editor} />
        <TestimonialsSection content={content.testimonials} editor={editor} />
        <ContactSection content={content.contact} editor={editor} />
      </main>
      <Footer content={content.footer} editor={editor} />
      <WhatsAppButton href={content.whatsappHref} disabled={editor?.isEditing} />
    </div>
  )
}
