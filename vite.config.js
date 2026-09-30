import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { scrapeListing } from './src/utils/scraper.js'

function devScraperPlugin() {
  return {
    name: 'dev-scraper-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost')
          if (urlObj.pathname === '/.netlify/functions/scrape' || urlObj.pathname === '/api/scrape') {
            const targetUrl = urlObj.searchParams.get('url')
            if (!targetUrl) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'url parameter required' }))
              return
            }

            try {
              const data = await scrapeListing(targetUrl)
              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.end(JSON.stringify(data))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.end(JSON.stringify({ error: err.message }))
            }
            return
          }
        } catch (_) {}
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devScraperPlugin()],
})
