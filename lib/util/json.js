// StarCraft internal server data scraper
// © MIT license

const fs = require('fs')

/**
 * Reads a JSON file synchronously and returns the results as a parsed object.
 */
const readJSON = filepath => {
  const content = fs.readFileSync(filepath, 'utf8')
  return JSON.parse(content)
}

/**
 * Returns a stringified JSON version of an object.
 */
const formatAsJSON = obj => {
  return JSON.stringify(obj, null, 2)
}

module.exports = {
  formatAsJSON,
  readJSON
}
