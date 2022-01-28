// StarCraft internal server data scraper
// © MIT license

/**
 * Creates a simple logger that can be toggled on/off.
 */
const makeLogger = () => {
  const state = {
    isEnabled: false
  }
  const log = (...obj) => {
    if (!state.isEnabled) {
      return
    }
    console.error(...obj)
  }
  log.setLogging = val => state.isEnabled = val
  return log
}

module.exports = {
  makeLogger
}
