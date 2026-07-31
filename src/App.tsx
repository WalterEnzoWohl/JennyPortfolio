import { useState, useEffect, useRef, type SVGProps } from 'react'
import { useHeroIntroAnimation } from './hooks/useHeroIntroAnimation'

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

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Sobre mí', href: '#sobre-mi' },
    { label: 'Portfolio', href: '#portfolio' },
    { label: 'Servicios', href: '#servicios' },
    { label: 'Tarifas', href: '#tarifas' },
    { label: 'Contacto', href: '#contacto' },
  ]

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
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
        {/* Logo */}
        <a href="#inicio" style={{ textDecoration: 'none' }} data-gsap="nav-logo">
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#FAF7F2', lineHeight: 1.1, letterSpacing: '0.08em' }}>
            <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.7, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Jennifer</div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Wohl</div>
          </div>
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }} className="hidden md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
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
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA button + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="#contacto"
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
            className="hidden sm:inline-block"
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
            Trabajemos juntos +
          </a>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            data-gsap="nav-item"
            style={{ background: 'none', border: 'none', color: '#F5F0E9', cursor: 'pointer', padding: 4 }}
            className="md:hidden"
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ backgroundColor: '#21070D', borderTop: '1px solid rgba(195,163,106,0.15)', padding: '20px 24px 24px' }} className="md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
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
              {l.label}
            </a>
          ))}
          <a
            href="#contacto"
            onClick={() => setMenuOpen(false)}
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
            Trabajemos juntos +
          </a>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
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
      <Sparkle size={10} className="sparkle" data-gsap="sparkle" data-gsap-float="true" style={{ position: 'absolute', top: 120, left: 80, color: '#C3A36A', opacity: 0.7 }} />
      <Sparkle size={7} className="sparkle-delay" data-gsap="sparkle" style={{ position: 'absolute', top: 200, left: 200, color: '#C3A36A', opacity: 0.5 }} />
      <Sparkle size={14} className="sparkle" data-gsap="sparkle" data-gsap-float="true" style={{ position: 'absolute', top: 160, right: 120, color: '#D7AAA8', opacity: 0.6 }} />
      <Sparkle size={8} className="sparkle-delay" data-gsap="sparkle" style={{ position: 'absolute', bottom: 200, left: 60, color: '#C3A36A', opacity: 0.4 }} />
      <Sparkle size={6} className="sparkle" data-gsap="sparkle" data-gsap-float="true" style={{ position: 'absolute', top: 300, right: 340, color: '#C3A36A', opacity: 0.5 }} />

      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 30% 40%, rgba(119,24,43,0.3) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="hero-grid">
        {/* Left column */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C3A36A', marginBottom: 24,
            border: '1px solid rgba(195,163,106,0.35)', padding: '6px 14px',
          }} data-gsap="hero-eyebrow">
            <Sparkle size={8} />
            Creadora de contenido UGC
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
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span data-gsap="hero-title-line" style={{ display: 'block' }}>Contenido</span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span data-gsap="hero-title-line" style={{ display: 'block' }}>auténtico que</span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden' }}>
              <span data-gsap="hero-title-line" style={{ display: 'block', color: '#D7AAA8', fontStyle: 'italic' }}>conecta y convierte</span>
            </span>
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
            Creo videos orgánicos, visualmente cuidados y pensados para que las marcas muestren sus productos de una forma cercana, confiable y natural.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
            <a
              href="#portfolio"
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
              Ver portfolio →
            </a>
            <a
              href="#contacto"
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
              Solicitar propuesta +
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(245,240,233,0.5)', marginBottom: 40 }} data-gsap="hero-meta">
            <IconMapPin />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, letterSpacing: '0.05em' }}>Benavídez, Buenos Aires, Argentina</span>
          </div>

          <div style={{
            display: 'flex', gap: 0, alignItems: 'center',
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(245,240,233,0.45)',
          }} data-gsap="hero-meta">
            {['Beauty', 'Skincare', 'Lifestyle', 'Reviews'].map((cat, i) => (
              <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {i > 0 && <span style={{ margin: '0 12px', opacity: 0.4 }}>·</span>}
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Right column — photos */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 520 }}>
          {/* Main photo */}
          <div style={{
            width: 280, height: 400,
            borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
            overflow: 'hidden',
            position: 'relative', zIndex: 3,
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            backgroundColor: '#c8a882',
          }} data-gsap="hero-image">
            <img
              src="https://images.unsplash.com/photo-1670201203116-26644750a726?w=560&h=800&fit=crop&auto=format&q=85"
              alt="Jennifer Wohl, creadora de contenido UGC de beauty y skincare"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Oval border decoration */}
          <div style={{
            position: 'absolute', width: 310, height: 430, zIndex: 2,
            borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
            border: '1px solid rgba(195,163,106,0.4)',
            transform: 'translate(16px, 12px)',
          }} />

          {/* Top-right oval: product */}
          <div style={{
            position: 'absolute', top: 20, right: 20,
            width: 110, height: 130,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(215,170,168,0.5)',
            backgroundColor: '#d4b896', zIndex: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }} data-gsap="hero-card">
            <img
              src="https://images.unsplash.com/photo-1585945037805-5fd82c2e60b1?w=220&h=260&fit=crop&auto=format&q=80"
              alt="Textura de crema skincare"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Bottom-left oval: jar */}
          <div style={{
            position: 'absolute', bottom: 30, left: 10,
            width: 95, height: 115,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(195,163,106,0.4)',
            backgroundColor: '#c8b89a', zIndex: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }} data-gsap="hero-card">
            <img
              src="https://images.unsplash.com/photo-1608068811588-3a67006b7489?w=190&h=230&fit=crop&auto=format&q=80"
              alt="Envase de producto de skincare"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Thin line decoration */}
          <div style={{
            position: 'absolute', top: 60, left: 30, right: 30, bottom: 60,
            borderRadius: '50%',
            border: '1px solid rgba(195,163,106,0.15)',
            zIndex: 1,
          }} />

          {/* Gold sparkles near photo */}
          <Sparkle size={10} className="sparkle" data-gsap="sparkle" style={{ position: 'absolute', top: 80, left: 55, color: '#C3A36A', zIndex: 5 }} />
          <Sparkle size={7} className="sparkle-delay" data-gsap="sparkle" style={{ position: 'absolute', bottom: 90, right: 40, color: '#D7AAA8', zIndex: 5 }} />
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

function BrandsSection() {
  const brands = ["L'Oréal", "YesStyle", "Dove", "Garnier", "Forme", "Disker"]

  return (
    <section id="marcas" style={{ backgroundColor: '#F5F0E9', padding: '72px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C3A36A', marginBottom: 16,
          }}>
            Marcas que confían en mí
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 600,
            color: '#1B1013', marginBottom: 16, lineHeight: 1.1,
          }}>
            Experiencia con marcas<br />
            <em style={{ fontStyle: 'italic', color: '#4D0715' }}>que inspiran</em>
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 14, lineHeight: 1.75,
            color: 'rgba(27,16,19,0.65)', maxWidth: 520, margin: '0 auto',
          }}>
            En mis primeros meses como creadora UGC participé en programas y colaboraciones que me permitieron desarrollar contenido para belleza, cuidado personal y experiencias digitales.
          </p>
        </div>

        {/* Logo row */}
        <div style={{
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
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── About ────────────────────────────────────────────────────────────────────

function AboutSection() {
  const attrs = [
    { label: 'Auténtica', icon: '✦' },
    { label: 'Creativa', icon: '◈' },
    { label: 'Detallista', icon: '◎' },
  ]

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
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center',
      }} className="about-grid">
        {/* Left */}
        <div>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C3A36A', marginBottom: 20,
          }}>
            Sobre mí
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 600,
            color: '#1B1013', marginBottom: 32, lineHeight: 1.05,
          }}>
            Hola, soy <em style={{ color: '#4D0715', fontStyle: 'italic' }}>Jenni</em>
          </h2>

          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, lineHeight: 1.85, color: 'rgba(27,16,19,0.72)' }}>
            <p style={{ marginBottom: 16 }}>
              Soy creadora de contenido UGC de Benavídez, Buenos Aires. Me especializo en producir videos auténticos y visualmente cuidados para marcas de belleza, skincare, cuidado personal y estilo de vida.
            </p>
            <p style={{ marginBottom: 16 }}>
              Creo contenido que muestra la experiencia real con cada producto: su textura, aplicación, beneficios, empaque y resultado final.
            </p>
            <p style={{ marginBottom: 16 }}>
              Trabajo con reseñas honestas, rutinas paso a paso, unboxings, tutoriales y formatos dinámicos pensados para Instagram Reels, TikTok y campañas publicitarias.
            </p>
            <p>
              Mi objetivo es que cada pieza se sienta cercana y orgánica, sin perder la estética y el mensaje de la marca.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
            {attrs.map((a) => (
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
                  {a.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — oval photo */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: 420 }}>
          {/* Outer decorative oval border */}
          <div style={{
            position: 'absolute',
            width: 300, height: 380,
            borderRadius: '50%',
            border: '1px solid rgba(77,7,21,0.3)',
            transform: 'translate(14px, 14px)',
          }} />
          {/* Photo container */}
          <div style={{
            width: 280, height: 360,
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#c8b299',
            boxShadow: '0 24px 60px rgba(77,7,21,0.2)',
            position: 'relative', zIndex: 2,
          }}>
            <img
              src="https://images.unsplash.com/photo-1728727267814-792db55ce678?w=560&h=720&fit=crop&auto=format&q=85"
              alt="Jennifer Wohl, creadora de contenido UGC"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <Sparkle size={12} className="sparkle" style={{ position: 'absolute', top: 30, right: 30, color: '#C3A36A' } as any} />
          <Sparkle size={8} className="sparkle-delay" style={{ position: 'absolute', bottom: 40, left: 20, color: '#D7AAA8' } as any} />
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

const formats = [
  {
    icon: '📦',
    title: 'Unboxing y hauls',
    desc: 'Apertura del producto, primeras impresiones, empaque y presentación de características.',
  },
  {
    icon: '🧴',
    title: 'Rutinas y aplicación',
    desc: 'Skincare, maquillaje y demostraciones paso a paso integradas en una rutina real.',
  },
  {
    icon: '⭐',
    title: 'Reviews y testimonios',
    desc: 'Opiniones auténticas, beneficios, experiencia de uso y recomendación del producto.',
  },
  {
    icon: '✨',
    title: 'GRWM y lifestyle',
    desc: 'Contenido cotidiano, visitas, cursos, experiencias y productos integrados naturalmente.',
  },
  {
    icon: '📷',
    title: 'Fotografía de producto',
    desc: 'Imágenes editoriales, estéticas y detalladas para redes sociales, ecommerce y campañas.',
  },
  {
    icon: '🎬',
    title: 'Tutoriales y aplicaciones',
    desc: 'Videos explicativos, green screen, voiceover y recorridos paso a paso por plataformas.',
  },
]

function ContentFormatsSection() {
  return (
    <section style={{ backgroundColor: '#F5F0E9', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C3A36A', marginBottom: 16,
          }}>
            Formatos de contenido
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 600,
            color: '#1B1013', lineHeight: 1.1,
          }}>
            Contenido pensado para<br />
            <em style={{ color: '#4D0715', fontStyle: 'italic' }}>cada objetivo</em>
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          borderTop: '1px solid rgba(77,7,21,0.15)',
        }}>
          {formats.map((f, i) => (
            <div
              key={f.title}
              style={{
                padding: '36px 28px',
                borderRight: i < formats.length - 1 ? '1px solid rgba(77,7,21,0.15)' : 'none',
                borderBottom: '1px solid rgba(77,7,21,0.15)',
                transition: 'background-color 0.25s',
                cursor: 'default',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(77,7,21,0.04)')}
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
                {f.title}
              </h3>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: 12.5, lineHeight: 1.7,
                color: 'rgba(27,16,19,0.6)',
              }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Video Portfolio ──────────────────────────────────────────────────────────

const videos = [
  { id: 1, brand: 'YesStyle', title: 'Rutina Skincare Paso a Paso', cat: 'Skincare', img: 'https://images.unsplash.com/photo-1670201203116-26644750a726?w=300&h=540&fit=crop&auto=format&q=80' },
  { id: 2, brand: 'Garnier', title: 'Textura y Demostración', cat: 'Skincare', img: 'https://images.unsplash.com/photo-1605769574581-b2511b6afa08?w=300&h=540&fit=crop&auto=format&q=80' },
  { id: 3, brand: 'Garnier', title: 'Unboxing y Rutina Completa', cat: 'Skincare', img: 'https://images.unsplash.com/photo-1728727267814-792db55ce678?w=300&h=540&fit=crop&auto=format&q=80' },
  { id: 4, brand: 'La Roche-Posay', title: 'Product Haul & Aesthetic', cat: 'Skincare', img: 'https://images.unsplash.com/photo-1695990190064-e8ca2ca16af6?w=300&h=540&fit=crop&auto=format&q=80' },
  { id: 5, brand: 'Visage Brushes', title: 'ASMR & Unboxing', cat: 'Makeup', img: 'https://images.unsplash.com/photo-1582616698198-f978da534162?w=300&h=540&fit=crop&auto=format&q=80' },
  { id: 6, brand: 'Makeup Masterclass', title: 'GRWM & Before/After', cat: 'Makeup', img: 'https://images.unsplash.com/photo-1585945037805-5fd82c2e60b1?w=300&h=540&fit=crop&auto=format&q=80' },
  { id: 7, brand: 'Ringo Audio', title: 'Unboxing & Review', cat: 'Lifestyle', img: 'https://images.unsplash.com/photo-1608068811588-3a67006b7489?w=300&h=540&fit=crop&auto=format&q=80' },
  { id: 8, brand: 'PedidosYa', title: 'Tutorial App & Cupones', cat: 'Apps y tecnología', img: 'https://images.unsplash.com/photo-1728994062543-74a1dc2c9392?w=300&h=540&fit=crop&auto=format&q=80' },
]

function VideoPortfolioSection() {
  const filters = ['Todos', 'Skincare', 'Makeup', 'Lifestyle', 'Apps y tecnología']
  const [active, setActive] = useState('Todos')
  const [modalVideo, setModalVideo] = useState<typeof videos[0] | null>(null)

  const filtered = active === 'Todos' ? videos : videos.filter((v) => v.cat === active)

  return (
    <section id="portfolio" style={{ backgroundColor: '#21070D', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 600,
            color: '#FAF7F2', lineHeight: 1.1, marginBottom: 40,
          }}>
            Videos que generan <em style={{ color: '#D7AAA8', fontStyle: 'italic' }}>impacto</em>
          </h2>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {filters.map((f) => (
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
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Phone mockup grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 20,
          justifyItems: 'center',
        }}>
          {filtered.map((v) => (
            <div
              key={v.id}
              onClick={() => setModalVideo(v)}
              style={{
                width: 140, cursor: 'pointer',
                transition: 'transform 0.25s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
            >
              {/* Phone frame */}
              <div style={{
                width: 140, height: 252,
                borderRadius: 24,
                border: '2px solid rgba(255,255,255,0.18)',
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#1B1013',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                {/* Notch */}
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 48, height: 8, backgroundColor: '#000',
                  borderRadius: '0 0 8px 8px', zIndex: 10,
                }} />
                <img src={v.img} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {/* Overlay + play */}
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
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <a
            href="#contacto"
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
            Ver más videos →
          </a>
        </div>
      </div>

      {/* Modal */}
      {modalVideo && (
        <div
          onClick={() => setModalVideo(null)}
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
              onClick={() => setModalVideo(null)}
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
                width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IconClose />
            </button>
            <img
              src={modalVideo.img.replace('w=300&h=540', 'w=640&h=1136')}
              alt={modalVideo.title}
              style={{ width: '100%', display: 'block' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(33,7,13,0.95))',
              padding: '40px 24px 28px',
            }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, color: '#C3A36A', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
                {modalVideo.brand}
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 20, fontWeight: 600, color: '#FAF7F2' }}>
                {modalVideo.title}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Services & Process ───────────────────────────────────────────────────────

const pricingCards = [
  {
    title: '1 Video UGC',
    price: '$50.000 ARS',
    items: ['Video de 15 a 60 segundos', 'Guion adaptado', 'Grabación y edición', 'Subtítulos', 'Música libre de derechos', 'Una instancia de ajustes'],
  },
  {
    title: 'Pack 2 Videos',
    price: '$90.000 ARS',
    items: ['Dos conceptos o ángulos distintos', 'Variación de gancho', 'Edición profesional', 'Subtítulos'],
    highlight: true,
  },
  {
    title: 'Pack 3 Videos',
    price: '$130.000 ARS',
    items: ['Tres videos: atención, beneficios y CTA', 'Estrategia de contenido', 'Edición profesional', 'Subtítulos'],
  },
  {
    title: 'Servicios adicionales',
    price: 'A consultar',
    items: ['Fotografía de producto', 'Material crudo', 'Versiones alternativas', 'Entrega urgente', 'Derechos para publicidad', 'Exclusividad'],
  },
]

const processSteps = [
  { num: '01', title: 'Briefing & Estrategia', desc: 'Definimos objetivos, público, mensaje y plataforma.' },
  { num: '02', title: 'Guion & Concepto', desc: 'Propuesta visual y narrativa alineada con la marca.' },
  { num: '03', title: 'Grabación & Edición', desc: 'Producción cuidando iluminación, audio y estética.' },
  { num: '04', title: 'Entrega', desc: 'Revisión y envío del material final listo para publicar.' },
]

function ServicesSection() {
  return (
    <section id="servicios" style={{ backgroundColor: '#FAF7F2', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C3A36A', marginBottom: 16,
          }}>
            Servicios & Tarifas
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 600,
            color: '#1B1013', lineHeight: 1.1, marginBottom: 64,
          }}>
            Soluciones <em style={{ color: '#4D0715', fontStyle: 'italic' }}>flexibles</em> para tu marca
          </h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20, marginBottom: 32,
        }} id="tarifas">
          {pricingCards.map((card) => (
            <div
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
                  Popular
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
                {card.title}
              </h3>
              <div style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 32, fontWeight: 700, color: '#4D0715', marginBottom: 24,
              }}>
                {card.price}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {card.items.map((item) => (
                  <li key={item} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    fontFamily: 'Manrope, sans-serif', fontSize: 12.5, lineHeight: 1.6,
                    color: 'rgba(27,16,19,0.7)', paddingBottom: 8,
                    borderBottom: '1px solid rgba(77,7,21,0.08)', marginBottom: 8,
                  }}>
                    <span style={{ color: '#C3A36A', marginTop: 2, flexShrink: 0 }}>✦</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#contacto"
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
                Solicitar →
              </a>
            </div>
          ))}
        </div>

        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: 11.5, lineHeight: 1.7,
          color: 'rgba(27,16,19,0.5)', textAlign: 'center', maxWidth: 640, margin: '0 auto 80px',
        }}>
          Tarifas orientativas en pesos argentinos. El presupuesto final puede variar según el brief, la complejidad de producción, los plazos y los derechos de utilización solicitados.
        </p>

        {/* Process */}
        <div id="proceso">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#C3A36A', marginBottom: 16,
            }}>
              Mi proceso de trabajo
            </div>
          </div>
          <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
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
                    {step.title}
                  </h4>
                  <p style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: 13, lineHeight: 1.7,
                    color: 'rgba(27,16,19,0.6)',
                  }}>
                    {step.desc}
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

function TestimonialsSection() {
  const stats = [
    { value: '+120K', label: 'Reproducciones', desc: 'Videos con alto alcance orgánico en Reels y TikTok.' },
    { value: '100%', label: 'Contenido auténtico', desc: 'Estilo cercano que conecta con la audiencia real.' },
    { value: '♻', label: 'Marcas que vuelven', desc: 'Relaciones a largo plazo basadas en resultados y compromiso.' },
  ]

  return (
    <section id="resultados" style={{ backgroundColor: '#F5F0E9', padding: '96px 24px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C3A36A', marginBottom: 16,
          }}>
            Lo que dicen las marcas
          </div>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 600,
            color: '#1B1013', lineHeight: 1.1,
          }}>
            Resultados que <em style={{ color: '#4D0715', fontStyle: 'italic' }}>hablan por sí solos</em>
          </h2>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
          {stats.map((s) => (
            <div
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
                {s.value}
              </div>
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#1B1013', marginBottom: 12,
              }}>
                {s.label}
              </div>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: 13, lineHeight: 1.7,
                color: 'rgba(27,16,19,0.6)',
              }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonial card */}
        <div style={{
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
              "Amamos el contenido. Superó nuestras expectativas, la audiencia respondió muy bien."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                backgroundColor: '#77182B', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, fontWeight: 600, color: '#FAF7F2',
              }}>M</div>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, color: '#FAF7F2' }}>
                  María
                </div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: 'rgba(245,240,233,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Garnier
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

function ContactSection() {
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
            Hagamos que tu producto se vea{' '}
            <em style={{ color: '#D7AAA8', fontStyle: 'italic' }}>tan bien como se siente</em>
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: 14, lineHeight: 1.8,
            color: 'rgba(245,240,233,0.65)', marginBottom: 40,
          }}>
            Creo contenido auténtico y visualmente cuidado para ayudar a las marcas a conectar con su audiencia de una forma cercana y natural.
          </p>
          <a
            href="mailto:jenniferaldana48@gmail.com"
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
            Trabajemos juntos →
          </a>
        </div>

        {/* Center — oval photo */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 140, height: 180,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(195,163,106,0.4)',
            backgroundColor: '#c8a882',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          }}>
            <img
              src="https://images.unsplash.com/photo-1670201203116-26644750a726?w=280&h=360&fit=crop&auto=format&q=80"
              alt="Jennifer Wohl"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Right — contact info */}
        <div>
          {[
            { icon: <IconWhatsApp />, label: 'WhatsApp', value: '+54 11 0000-0000', href: 'https://wa.me/5401100000000' },
            { icon: <IconEmail />, label: 'Email', value: 'jenniferaldana48@gmail.com', href: 'mailto:jenniferaldana48@gmail.com' },
            { icon: <IconInstagram />, label: 'Instagram', value: '@jennii.wohl', href: 'https://instagram.com/jennii.wohl' },
            { icon: <IconTikTok />, label: 'TikTok', value: '@jenniii.wohl', href: 'https://tiktok.com/@jenniii.wohl' },
            { icon: <IconMapPin />, label: 'Ubicación', value: 'Benavídez, Buenos Aires, Argentina', href: null },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 0',
                borderBottom: '1px solid rgba(245,240,233,0.08)',
              }}
            >
              <div style={{ color: '#C3A36A', flexShrink: 0, width: 20, display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,240,233,0.4)', marginBottom: 2 }}>
                  {item.label}
                </div>
                {item.href ? (
                  <a href={item.href} style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#FAF7F2', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#C3A36A')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#FAF7F2')}
                  >
                    {item.value}
                  </a>
                ) : (
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#FAF7F2' }}>
                    {item.value}
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

function Footer() {
  return (
    <footer style={{
      backgroundColor: '#21070D',
      borderTop: '1px solid rgba(195,163,106,0.2)',
      padding: '36px 24px',
    }}>
      <div style={{
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
            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 18, fontWeight: 600, color: '#C3A36A' }}>JW</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 14, color: '#FAF7F2', letterSpacing: '0.1em' }}>
              Jennifer Wohl
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,240,233,0.4)' }}>
              UGC Creator
            </div>
          </div>
        </div>

        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: 'rgba(245,240,233,0.35)' }}>
          © {new Date().getFullYear()} Jennifer Wohl. Todos los derechos reservados.
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {[
            { icon: <IconInstagram size={16} />, href: 'https://instagram.com/jennii.wohl', label: 'Instagram' },
            { icon: <IconTikTok size={16} />, href: 'https://tiktok.com/@jenniii.wohl', label: 'TikTok' },
            { icon: <IconEmail size={16} />, href: 'mailto:jenniferaldana48@gmail.com', label: 'Email' },
          ].map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              style={{ color: 'rgba(245,240,233,0.45)', transition: 'color 0.2s' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#C3A36A')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(245,240,233,0.45)')}
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ─── WhatsApp Float ───────────────────────────────────────────────────────────

function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5401100000000"
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
  const introRef = useRef<HTMLDivElement | null>(null)
  useHeroIntroAnimation(introRef)

  return (
    <div ref={introRef} style={{ minHeight: '100vh' }}>
      <Navbar />
      <main>
        <HeroSection />
        <BrandsSection />
        <AboutSection />
        <ContentFormatsSection />
        <VideoPortfolioSection />
        <ServicesSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
