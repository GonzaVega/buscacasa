// Netlify serverless function: /.netlify/functions/scrape
// Fetches a real estate listing URL server-side (no CORS issues) and extracts metadata.
// Usage: GET /.netlify/functions/scrape?url=https://...

import { scrapeListing } from '../../src/utils/scraper.js'

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  const url = event.queryStringParameters?.url
  if (!url) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'url parameter required' }) }
  }

  try {
    const data = await scrapeListing(url)
    return { statusCode: 200, headers, body: JSON.stringify(data) }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
