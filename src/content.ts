export type NavLink = {
  label: string
  href: string
}

export type ImageAsset = {
  src: string
  alt: string
  storageKey?: string
}

export type ContentFormat = {
  icon: string
  title: string
  desc: string
}

export type VideoItem = {
  id: string
  brand: string
  title: string
  cat: string
  img: string
  hidden?: boolean
  storageKey?: string
  posterStorageKey?: string
  videoSrc?: string
}

export type PricingCard = {
  id: string
  title: string
  price: string
  items: string[]
  highlight?: boolean
}

export type ProcessStep = {
  num: string
  title: string
  desc: string
}

export type ContactIcon = 'whatsapp' | 'email' | 'instagram' | 'tiktok' | 'map'

export type ContactItem = {
  icon: ContactIcon
  label: string
  value: string
  href: string | null
}

export type SocialItem = {
  icon: Exclude<ContactIcon, 'whatsapp' | 'map'>
  label: string
  href: string
}

export type PortfolioContent = {
  nav: {
    logoEyebrow: string
    logoName: string
    cta: string
    links: NavLink[]
  }
  hero: {
    eyebrow: string
    titleLines: string[]
    description: string
    primaryCta: string
    secondaryCta: string
    location: string
    categories: string[]
    mainImage: ImageAsset
    sideImages: ImageAsset[]
  }
  brands: {
    eyebrow: string
    titleLine: string
    titleAccent: string
    description: string
    items: string[]
  }
  about: {
    eyebrow: string
    titlePrefix: string
    titleAccent: string
    paragraphs: string[]
    attributes: Array<{ label: string; icon: string }>
  }
  formats: {
    eyebrow: string
    titleLine: string
    titleAccent: string
    items: ContentFormat[]
  }
  videos: {
    titlePrefix: string
    titleAccent: string
    cta: string
    filters: string[]
    items: VideoItem[]
  }
  services: {
    eyebrow: string
    titlePrefix: string
    titleAccent: string
    titleSuffix: string
    popularBadge: string
    requestCta: string
    pricingNote: string
    pricingCards: PricingCard[]
    processEyebrow: string
    processSteps: ProcessStep[]
  }
  testimonials: {
    eyebrow: string
    titlePrefix: string
    titleAccent: string
    stats: Array<{ value: string; label: string; desc: string }>
    quote: string
    authorInitial: string
    author: string
    company: string
  }
  contact: {
    titlePrefix: string
    titleAccent: string
    description: string
    cta: string
    emailHref: string
    image: ImageAsset
    info: ContactItem[]
  }
  footer: {
    monogram: string
    name: string
    role: string
    copyrightName: string
    socials: SocialItem[]
  }
  whatsappHref: string
}

export const defaultPortfolioContent: PortfolioContent = {
  nav: {
    logoEyebrow: 'Jennifer',
    logoName: 'Wohl',
    cta: 'Trabajemos juntos +',
    links: [
      { label: 'Inicio', href: '#inicio' },
      { label: 'Sobre mí', href: '#sobre-mi' },
      { label: 'Portfolio', href: '#portfolio' },
      { label: 'Servicios', href: '#servicios' },
      { label: 'Tarifas', href: '#tarifas' },
      { label: 'Contacto', href: '#contacto' },
    ],
  },
  hero: {
    eyebrow: 'Creadora de contenido UGC',
    titleLines: ['Contenido', 'auténtico que', 'conecta y convierte'],
    description: 'Creo videos orgánicos, visualmente cuidados y pensados para que las marcas muestren sus productos de una forma cercana, confiable y natural.',
    primaryCta: 'Ver portfolio →',
    secondaryCta: 'Solicitar propuesta +',
    location: 'Benavídez, Buenos Aires, Argentina',
    categories: ['Beauty', 'Skincare', 'Lifestyle', 'Reviews'],
    mainImage: {
      src: 'https://images.unsplash.com/photo-1670201203116-26644750a726?w=560&h=800&fit=crop&auto=format&q=85',
      alt: 'Jennifer Wohl, creadora de contenido UGC de beauty y skincare',
    },
    sideImages: [
      {
        src: 'https://images.unsplash.com/photo-1585945037805-5fd82c2e60b1?w=220&h=260&fit=crop&auto=format&q=80',
        alt: 'Textura de crema skincare',
      },
      {
        src: 'https://images.unsplash.com/photo-1608068811588-3a67006b7489?w=190&h=230&fit=crop&auto=format&q=80',
        alt: 'Envase de producto de skincare',
      },
    ],
  },
  brands: {
    eyebrow: 'Marcas que confían en mí',
    titleLine: 'Experiencia con marcas',
    titleAccent: 'que inspiran',
    description: 'En mis primeros meses como creadora UGC participé en programas y colaboraciones que me permitieron desarrollar contenido para belleza, cuidado personal y experiencias digitales.',
    items: ["L'Oréal", 'YesStyle', 'Dove', 'Garnier', 'Forme', 'Disker'],
  },
  about: {
    eyebrow: 'Sobre mí',
    titlePrefix: 'Hola, soy',
    titleAccent: 'Jenni',
    paragraphs: [
      'Soy creadora de contenido UGC de Benavídez, Buenos Aires. Me especializo en producir videos auténticos y visualmente cuidados para marcas de belleza, skincare, cuidado personal y estilo de vida.',
      'Creo contenido que muestra la experiencia real con cada producto: su textura, aplicación, beneficios, empaque y resultado final.',
      'Trabajo con reseñas honestas, rutinas paso a paso, unboxings, tutoriales y formatos dinámicos pensados para Instagram Reels, TikTok y campañas publicitarias.',
      'Mi objetivo es que cada pieza se sienta cercana y orgánica, sin perder la estética y el mensaje de la marca.',
    ],
    attributes: [
      { label: 'Auténtica', icon: '✦' },
      { label: 'Creativa', icon: '◈' },
      { label: 'Detallista', icon: '◎' },
    ],
  },
  formats: {
    eyebrow: 'Formatos de contenido',
    titleLine: 'Contenido pensado para',
    titleAccent: 'cada objetivo',
    items: [
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
    ],
  },
  videos: {
    titlePrefix: 'Videos que generan',
    titleAccent: 'impacto',
    cta: 'Ver más videos →',
    filters: ['Todos', 'Skincare', 'Makeup', 'Lifestyle', 'Apps y tecnología'],
    items: [
      { id: '1', brand: 'YesStyle', title: 'Rutina Skincare Paso a Paso', cat: 'Skincare', img: 'https://images.unsplash.com/photo-1670201203116-26644750a726?w=300&h=540&fit=crop&auto=format&q=80' },
      { id: '2', brand: 'Garnier', title: 'Textura y Demostración', cat: 'Skincare', img: 'https://images.unsplash.com/photo-1605769574581-b2511b6afa08?w=300&h=540&fit=crop&auto=format&q=80' },
      { id: '3', brand: 'Garnier', title: 'Unboxing y Rutina Completa', cat: 'Skincare', img: 'https://images.unsplash.com/photo-1728727267814-792db55ce678?w=300&h=540&fit=crop&auto=format&q=80' },
      { id: '4', brand: 'La Roche-Posay', title: 'Product Haul & Aesthetic', cat: 'Skincare', img: 'https://images.unsplash.com/photo-1695990190064-e8ca2ca16af6?w=300&h=540&fit=crop&auto=format&q=80' },
      { id: '5', brand: 'Visage Brushes', title: 'ASMR & Unboxing', cat: 'Makeup', img: 'https://images.unsplash.com/photo-1582616698198-f978da534162?w=300&h=540&fit=crop&auto=format&q=80' },
      { id: '6', brand: 'Makeup Masterclass', title: 'GRWM & Before/After', cat: 'Makeup', img: 'https://images.unsplash.com/photo-1585945037805-5fd82c2e60b1?w=300&h=540&fit=crop&auto=format&q=80' },
      { id: '7', brand: 'Ringo Audio', title: 'Unboxing & Review', cat: 'Lifestyle', img: 'https://images.unsplash.com/photo-1608068811588-3a67006b7489?w=300&h=540&fit=crop&auto=format&q=80' },
      { id: '8', brand: 'PedidosYa', title: 'Tutorial App & Cupones', cat: 'Apps y tecnología', img: 'https://images.unsplash.com/photo-1728994062543-74a1dc2c9392?w=300&h=540&fit=crop&auto=format&q=80' },
    ],
  },
  services: {
    eyebrow: 'Servicios & Tarifas',
    titlePrefix: 'Soluciones',
    titleAccent: 'flexibles',
    titleSuffix: 'para tu marca',
    popularBadge: 'Popular',
    requestCta: 'Solicitar →',
    pricingNote: 'Tarifas orientativas en pesos argentinos. El presupuesto final puede variar según el brief, la complejidad de producción, los plazos y los derechos de utilización solicitados.',
    pricingCards: [
      {
        id: 'video-ugc',
        title: '1 Video UGC',
        price: '$50.000 ARS',
        items: ['Video de 15 a 60 segundos', 'Guion adaptado', 'Grabación y edición', 'Subtítulos', 'Música libre de derechos', 'Una instancia de ajustes'],
      },
      {
        id: 'pack-2',
        title: 'Pack 2 Videos',
        price: '$90.000 ARS',
        items: ['Dos conceptos o ángulos distintos', 'Variación de gancho', 'Edición profesional', 'Subtítulos'],
        highlight: true,
      },
      {
        id: 'pack-3',
        title: 'Pack 3 Videos',
        price: '$130.000 ARS',
        items: ['Tres videos: atención, beneficios y CTA', 'Estrategia de contenido', 'Edición profesional', 'Subtítulos'],
      },
      {
        id: 'extras',
        title: 'Servicios adicionales',
        price: 'A consultar',
        items: ['Fotografía de producto', 'Material crudo', 'Versiones alternativas', 'Entrega urgente', 'Derechos para publicidad', 'Exclusividad'],
      },
    ],
    processEyebrow: 'Mi proceso de trabajo',
    processSteps: [
      { num: '01', title: 'Briefing & Estrategia', desc: 'Definimos objetivos, público, mensaje y plataforma.' },
      { num: '02', title: 'Guion & Concepto', desc: 'Propuesta visual y narrativa alineada con la marca.' },
      { num: '03', title: 'Grabación & Edición', desc: 'Producción cuidando iluminación, audio y estética.' },
      { num: '04', title: 'Entrega', desc: 'Revisión y envío del material final listo para publicar.' },
    ],
  },
  testimonials: {
    eyebrow: 'Lo que dicen las marcas',
    titlePrefix: 'Resultados que',
    titleAccent: 'hablan por sí solos',
    stats: [
      { value: '+120K', label: 'Reproducciones', desc: 'Videos con alto alcance orgánico en Reels y TikTok.' },
      { value: '100%', label: 'Contenido auténtico', desc: 'Estilo cercano que conecta con la audiencia real.' },
      { value: '♻', label: 'Marcas que vuelven', desc: 'Relaciones a largo plazo basadas en resultados y compromiso.' },
    ],
    quote: '"Amamos el contenido. Superó nuestras expectativas, la audiencia respondió muy bien."',
    authorInitial: 'M',
    author: 'María',
    company: 'Garnier',
  },
  contact: {
    titlePrefix: 'Hagamos que tu producto se vea',
    titleAccent: 'tan bien como se siente',
    description: 'Creo contenido auténtico y visualmente cuidado para ayudar a las marcas a conectar con su audiencia de una forma cercana y natural.',
    cta: 'Trabajemos juntos →',
    emailHref: 'mailto:jenniferaldana48@gmail.com',
    image: {
      src: 'https://images.unsplash.com/photo-1670201203116-26644750a726?w=280&h=360&fit=crop&auto=format&q=80',
      alt: 'Jennifer Wohl',
    },
    info: [
      { icon: 'whatsapp', label: 'WhatsApp', value: '+54 9 11 5583-8867', href: 'https://wa.me/5491155838867' },
      { icon: 'email', label: 'Email', value: 'jenniferaldana48@gmail.com', href: 'mailto:jenniferaldana48@gmail.com' },
      { icon: 'instagram', label: 'Instagram', value: '@jennii.wohl', href: 'https://instagram.com/jennii.wohl' },
      { icon: 'tiktok', label: 'TikTok', value: '@jenniii.wohl', href: 'https://tiktok.com/@jenniii.wohl' },
      { icon: 'map', label: 'Ubicación', value: 'Benavídez, Buenos Aires, Argentina', href: null },
    ],
  },
  footer: {
    monogram: 'JW',
    name: 'Jennifer Wohl',
    role: 'UGC Creator',
    copyrightName: 'Jennifer Wohl',
    socials: [
      { icon: 'instagram', href: 'https://instagram.com/jennii.wohl', label: 'Instagram' },
      { icon: 'tiktok', href: 'https://tiktok.com/@jenniii.wohl', label: 'TikTok' },
      { icon: 'email', href: 'mailto:jenniferaldana48@gmail.com', label: 'Email' },
    ],
  },
  whatsappHref: 'https://wa.me/5491155838867',
}
