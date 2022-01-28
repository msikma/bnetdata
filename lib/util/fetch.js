// StarCraft internal server data scraper
// © MIT license

const fetch = require('node-fetch')

/**
 * Fetches a resource and parses it as JSON.
 */
const fetchAsJSON = async (url) => {
  const req = await fetch(url)
  const data = await req.json()
  return data
}

module.exports = {
  fetchAsJSON
}
