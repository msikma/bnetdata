// StarCraft internal server data scraper
// © MIT license

const {isPlainObject} = require('./data')

/**
 * Outputs a given piece of data and exits.
 * 
 * If the data is a plain object, it will be rendered as JSON.
 */
const outputAndExit = (outputFunction, data, exitCode) => {
  if (isPlainObject(data)) {
    data = JSON.stringify(data, null, 2)
  }
  outputFunction(data)
  process.exitCode = exitCode
}

/**
 * Runs a given function and outputs the result as a success or error, depending on whether it threw.
 */
const outputResult = async wrappingFunction => {
  try {
    const res = await wrappingFunction()
    return outputSuccess(res)
  }
  catch (error) {
    const {name, message} = error
    return outputError({error: {name, message}})
  }
}

/**
 * Outputs data as a result of a successful invocation.
 */
const outputSuccess = (data, exitCode = 0) => {
  return outputAndExit(console.log, data, exitCode)
}

/**
 * Outputs data as a result of a successful invocation.
 */
const outputError = (data, exitCode = 1) => {
  return outputAndExit(console.error, data, exitCode)
}

module.exports = {
  outputResult,
  outputSuccess,
  outputError
}
