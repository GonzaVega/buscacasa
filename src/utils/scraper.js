// Scraper & Geolocation utility for Argentine real estate portals
// Handles Inmoup, Zonaprop, Argenprop, MercadoLibre, Properati, Remax, etc.

export function cleanTitle(title) {
  if (!title) return ''
  return title
    .replace(/\s*\|.*$/, '')
    .replace(/\s*-\s*(Zonaprop|Argenprop|MercadoLibre|Properati|Remax|Inmoup|InfoCasas|La Capital).*$/i, '')
    .replace(/\s*[-–]\s*(?:\$|USD|U\$S)\s*[\d.,]+\s*$/i, '')
    .replace(/\s*(?:\$|USD|U\$S)\s*[\d.,]+\s*$/i, '')
    .trim()
}

export function extractNeighborhood(text) {
  if (!text) return ''
  const matches = text.matchAll(/\ben\s+([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?:\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)*)/gu)
  const exclude = [
    'venta', 'alquiler', 'departamento', 'casa', 'piso', 'local',
    'muy', 'excelente', 'pesos', 'dolares', 'dólares', 'capital',
    'barrio', 'edificio', 'complejo', 'zona', 'calle', 'av', 'avenida'
  ]
  for (const match of matches) {
    const candidate = match[1].trim()
    if (!exclude.includes(candidate.toLowerCase())) {
      return candidate
    }
  }
  return ''
}

export function extractNeighborhoodFromWords(words) {
  const types = ['departamento', 'casa', 'ph', 'terreno', 'oficina', 'propiedad']
  const stops = ['calle', 'av', 'avenida', 'con', 'sin', 'dormitorios', 'dormitorio', 'ambientes', 'ambiente', 'cochera', 'patio', 'terraza', 'balcon', 'balcón', 'frente', 'piso']
  const exclude = ['venta', 'alquiler', 'clasificado', 'propiedades', ...types]

  // 1. Look for "en <barrio>"
  for (let i = 0; i < words.length; i++) {
    if (words[i].toLowerCase() === 'en' && i + 1 < words.length) {
      const nextWord = words[i + 1].toLowerCase()
      if (!exclude.includes(nextWord)) {
        const candidateWords = [words[i + 1]]
        if (i + 2 < words.length && !exclude.includes(words[i + 2].toLowerCase()) && !stops.includes(words[i + 2].toLowerCase())) {
          candidateWords.push(words[i + 2])
        }
        return candidateWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      }
    }
  }

  // 2. Look after property type (e.g. "departamento-godoy-cruz-calle-...")
  const typeIndex = words.findIndex(w => types.includes(w.toLowerCase()))
  if (typeIndex !== -1 && typeIndex + 1 < words.length) {
    const candidateWords = []
    for (let i = typeIndex + 1; i < words.length; i++) {
      const w = words[i].toLowerCase()
      if (stops.includes(w) || exclude.includes(w)) break
      candidateWords.push(words[i])
      if (candidateWords.length >= 2) break
    }
    if (candidateWords.length > 0) {
      return candidateWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    }
  }

  return ''
}

export function extractFromUrlSlug(urlStr, warningMsg = '') {
  try {
    const parsed = new URL(urlStr)
    const segments = parsed.pathname.split('/').filter(Boolean)
    const lastSeg = segments[segments.length - 1]?.replace(/\.html?$/i, '') || ''
    const cleanSlug = lastSeg.replace(/-\d{5,}(?:-[a-z0-9]+)?$/i, '')

    const words = cleanSlug.split(/[-_]+/).filter(w => w.length > 0)
    const formatted = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

    const neighborhood = extractNeighborhoodFromWords(words)

    return {
      title: formatted || `Publicación en ${parsed.hostname}`,
      price: '',
      expenses: '',
      neighborhood: neighborhood || '',
      photos: [],
      image: '',
      phone: '',
      warning: warningMsg || 'Cloudflare bloqueó el acceso directo. Cargamos el título y barrio desde el enlace. Completá el precio y fotos.',
    }
  } catch (_) {
    return {
      title: '',
      price: '',
      expenses: '',
      neighborhood: '',
      photos: [],
      image: '',
      phone: '',
      warning: warningMsg,
    }
  }
}

export function extractFromUrl(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/').filter(Boolean)
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i]
      const words = seg.replace(/[-_]/g, ' ')
      const match = words.match(/\ben\s+([a-záéíóúñü\s]+)/i)
      if (match) {
        return match[1].trim().replace(/\b\w/g, c => c.toUpperCase())
      }
    }
    const match = url.match(/[-_\/]([a-z]{4,}(?:-[a-z]+)*?)(?:\.html?|\d|$)/i)
    const word = match?.[1]?.replace(/-/g, ' ')
    const exclude = ['departamentos', 'casas', 'alquiler', 'venta', 'ambientes', 'html', 'inmuebles', 'ficha']
    return word && !exclude.includes(word.toLowerCase()) ? word.replace(/\b\w/g, c => c.toUpperCase()) : ''
  } catch (_) {
    return ''
  }
}

export function extractMeta(html, url = '') {
  const meta = (prop) => {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
           || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'))
    return m?.[1] || ''
  }

  const rawTitle = meta('og:title') || html.match(/<title>([^<]+)<\/title>/i)?.[1] || ''
  const desc = meta('og:description') || meta('description') || ''

  // Collect photos
  const photoCandidates = []

  // Inmoup specific CloudFront images
  const cfImages = [...html.matchAll(/https:\/\/d16v4wpqyuresn\.cloudfront\.net\/[^\s"']+/gi)].map(m => m[0])
  for (const img of cfImages) {
    if (img.includes('1024x576') || img.includes('wm_hash')) photoCandidates.push(img)
  }

  // Common real estate CDN photo matches
  const cdnImages = [...html.matchAll(/https:\/\/[^\s"']+(?:tokkobroker\.com|zonapropcdn\.com|argenprop\.com|mlstatic\.com)[^\s"']+\.(?:jpg|jpeg|png|webp)/gi)].map(m => m[0])
  photoCandidates.push(...cdnImages)

  // Meta og:image / twitter:image
  const metaImages = [...html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/gi)].map(m => m[1])
  photoCandidates.push(...metaImages)

  const cleanPhotos = [...new Set(photoCandidates)].filter(src => {
    if (!src || !src.startsWith('http')) return false
    const lower = src.toLowerCase()
    return !lower.includes('logo') && !lower.includes('icon') && !lower.includes('avatar') && !lower.includes('banner') && !lower.includes('favicon')
  }).slice(0, 10)

  const image = cleanPhotos[0] || meta('og:image') || ''

  // Price
  let price = ''
  const priceMatch = (rawTitle + ' ' + desc).match(/\$\s*([\d.,]+)/)
  if (priceMatch) {
    const p = priceMatch[1].replace(/\./g, '').replace(',', '.')
    price = parseInt(p, 10) || ''
  } else {
    const usdMatch = (rawTitle + ' ' + desc).match(/(?:USD|U\$S|US\$)\s*([\d.,]+)/i)
    if (usdMatch) {
      const p = usdMatch[1].replace(/\./g, '').replace(',', '.')
      price = parseInt(p, 10) || ''
    }
  }

  // Expensas
  let expenses = ''
  const expMatch = (desc + ' ' + html).match(/expensas[^\d$]{0,25}\$?\s*([\d.,]+)/i)
  if (expMatch) {
    const exp = expMatch[1].replace(/\./g, '').replace(',', '.')
    expenses = parseInt(exp, 10) || ''
  }

  const title = cleanTitle(rawTitle)
  const neighborhood = extractNeighborhood(rawTitle + ' ' + desc) || extractFromUrl(url)

  // Phone / whatsapp
  let phone = ''
  const waMatch = html.match(/(?:wa\.me\/|whatsapp\.com\/send\?phone=)(\d+)/i)
               || (rawTitle + ' ' + desc).match(/(?:tel|cel|whatsapp|contacto)[^\d]{0,10}(\+?54[\d\s-]{8,}|\b11[\d\s-]{7,}|\b261[\d\s-]{6,})/i)
  if (waMatch) {
    phone = waMatch[1].replace(/\D/g, '')
  }

  return {
    title,
    price,
    expenses,
    neighborhood,
    image,
    photos: cleanPhotos,
    phone,
  }
}

// Parses freely copied text from a listing (e.g. copied from Zonaprop or WhatsApp)
export function parsePastedText(text) {
  if (!text) return {}

  let price = ''
  const priceMatch = text.match(/\$\s*([\d.,]+)/)
  if (priceMatch) {
    price = parseInt(priceMatch[1].replace(/\./g, '').replace(',', '.'), 10) || ''
  } else {
    const usdMatch = text.match(/(?:USD|U\$S|US\$)\s*([\d.,]+)/i)
    if (usdMatch) {
      price = parseInt(usdMatch[1].replace(/\./g, '').replace(',', '.'), 10) || ''
    }
  }

  let expenses = ''
  const expMatch = text.match(/expensas[^\d$]{0,25}\$?\s*([\d.,]+)/i)
  if (expMatch) {
    expenses = parseInt(expMatch[1].replace(/\./g, '').replace(',', '.'), 10) || ''
  }

  const neighborhood = extractNeighborhood(text)

  return { price, expenses, neighborhood }
}

export async function scrapeListing(url) {
  if (!url || !url.startsWith('http')) {
    throw new Error('URL inválida')
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(9000),
    })

    // If Cloudflare or anti-bot blocks with 403/401/503
    if (res.status === 403 || res.status === 401 || res.status === 503) {
      return extractFromUrlSlug(url, 'Zonaprop protege sus publicaciones con Cloudflare. Cargamos el título y barrio desde el enlace.')
    }

    if (!res.ok) {
      return extractFromUrlSlug(url, `La página respondió con estado ${res.status}. Cargamos los datos del enlace.`)
    }

    const html = await res.text()

    if (html.includes('Just a moment...') || html.includes('cf-browser-verification')) {
      return extractFromUrlSlug(url, 'Zonaprop protege sus publicaciones con Cloudflare. Cargamos el título y barrio desde el enlace.')
    }

    return extractMeta(html, url)
  } catch (err) {
    // Graceful fallback to slug parsing if network or timeout fails
    return extractFromUrlSlug(url, 'No se pudo conectar a la página. Se extrajo título y barrio desde el enlace.')
  }
}

// Geocoding helper using OpenStreetMap Nominatim (Free, no API key required)
export async function geocodeLocation(query) {
  if (!query || query.trim().length < 3) return null
  try {
    const cleanQuery = query
      .replace(/\b(?:calle|av\.?|avenida|depto|dto|departamento)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=1&countrycodes=ar`
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BuscaCasaApp/1.0',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return null
    const list = await res.json()
    if (!list || list.length === 0) return null

    const item = list[0]
    return {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
    }
  } catch (_) {
    return null
  }
}
