import type { RefObject } from 'react'
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function useHeroIntroAnimation(scopeRef: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const root = scopeRef.current
    if (!root) return

    const selector = gsap.utils.selector(root)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches
    const navbar = selector('[data-gsap="navbar"]')
    const navLogo = selector('[data-gsap="nav-logo"]')
    const navItems = selector('[data-gsap="nav-item"]')
    const heroEyebrow = selector('[data-gsap="hero-eyebrow"]')
    const heroTitleLines = selector('[data-gsap="hero-title-line"]')
    const heroDescription = selector('[data-gsap="hero-description"]')
    const heroActions = selector('[data-gsap="hero-action"]')
    const heroMeta = selector('[data-gsap="hero-meta"]')
    const heroImage = selector('[data-gsap="hero-image"]')
    const heroCards = selector('[data-gsap="hero-card"]')
    const sparkles = selector('[data-gsap="sparkle"]')
    const floatingSparkles = selector('[data-gsap-float="true"]')

    const introTargets = selector(
      [
        '[data-gsap="navbar"]',
        '[data-gsap="nav-logo"]',
        '[data-gsap="nav-item"]',
        '[data-gsap="hero-eyebrow"]',
        '[data-gsap="hero-title-line"]',
        '[data-gsap="hero-description"]',
        '[data-gsap="hero-action"]',
        '[data-gsap="hero-meta"]',
        '[data-gsap="hero-image"]',
        '[data-gsap="hero-card"]',
        '[data-gsap="sparkle"]',
      ].join(','),
    )

    if (prefersReducedMotion) {
      gsap.set(introTargets, { clearProps: 'all', opacity: 1 })
      return
    }

    let cleanupHover = () => {}

    const durationScale = isMobile ? 0.82 : 1
    const imageX = isMobile ? 0 : isTablet ? 18 : 35
    const titleDuration = isMobile ? 0.76 : 0.92
    const titleStagger = isMobile ? 0.075 : 0.1

    const timeline = gsap.timeline({ defaults: { force3D: true } })
    const sparkleFloat = gsap.timeline({ paused: true, repeat: -1, yoyo: true })

    timeline
      .from(navbar, {
        opacity: 0,
        y: -16,
        duration: 0.6 * durationScale,
        ease: 'power3.out',
      })
      .from(navLogo, {
        opacity: 0,
        y: -10,
        duration: 0.42 * durationScale,
        ease: 'power3.out',
      }, '-=0.38')
      .from(navItems, {
        opacity: 0,
        y: -8,
        duration: 0.42 * durationScale,
        stagger: 0.045,
        ease: 'power3.out',
      }, '-=0.3')
      .from(heroEyebrow, {
        opacity: 0,
        y: 18,
        duration: 0.5 * durationScale,
        ease: 'power3.out',
      }, '-=0.06')
      .from(heroTitleLines, {
        opacity: 0,
        yPercent: 110,
        duration: titleDuration,
        stagger: titleStagger,
        ease: 'power4.out',
      }, '-=0.05')
      .from(heroImage, {
        opacity: 0,
        scale: 1.06,
        x: imageX,
        duration: 1.08 * durationScale,
        ease: 'power3.out',
      }, '<0.18')
      .from(heroDescription, {
        opacity: 0,
        y: 20,
        duration: 0.55 * durationScale,
        ease: 'power3.out',
      }, '>-0.22')
      .fromTo(heroActions, {
        opacity: 0,
        y: 20,
      }, {
        opacity: 1,
        y: 0,
        duration: 0.55 * durationScale,
        stagger: isMobile ? 0.06 : 0.08,
        ease: 'power3.out',
      }, '-=0.24')
      .from(heroMeta, {
        opacity: 0,
        y: 20,
        duration: 0.55 * durationScale,
        stagger: 0.07,
        ease: 'power3.out',
      }, '-=0.22')
      .from(heroCards, {
        opacity: 0,
        scale: 0.88,
        duration: 0.7 * durationScale,
        stagger: 0.15,
        ease: 'back.out(1.2)',
      }, '-=0.2')
      .from(sparkles, {
        opacity: 0,
        scale: 0.55,
        rotation: -10,
        duration: 0.48 * durationScale,
        stagger: 0.055,
        ease: 'power3.out',
      }, '-=0.34')
      .set(heroActions, { clearProps: 'opacity,transform' })
      .call(() => sparkleFloat.play(), undefined, '>')

    sparkleFloat.to(floatingSparkles, {
      y: (index: number) => (index % 2 === 0 ? -5 : 4),
      rotation: (index: number) => (index % 2 === 0 ? 3 : -3),
      duration: (index: number) => 3.4 + index * 0.45,
      stagger: 0.2,
      ease: 'sine.inOut',
    })

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const actions = gsap.utils.toArray<HTMLElement>('[data-gsap="hero-action"]', root)
      const listeners = actions.map((action) => {
        const handleEnter = () => {
          gsap.to(action, { scale: 1.02, y: -2, duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
        }
        const handleLeave = () => {
          gsap.to(action, { scale: 1, y: 0, duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
        }

        action.addEventListener('pointerenter', handleEnter)
        action.addEventListener('pointerleave', handleLeave)

        return () => {
          action.removeEventListener('pointerenter', handleEnter)
          action.removeEventListener('pointerleave', handleLeave)
        }
      })

      cleanupHover = () => listeners.forEach((removeListener) => removeListener())
    }

    return () => {
      cleanupHover()
    }
  }, { scope: scopeRef })
}
