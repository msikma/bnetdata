// StarCraft internal server data example
// © MIT license

const exec = require('./exec')
const data = require('./data')
const tools = require('./tools')

module.exports = {
  ...exec,
  ...data,
  ...tools
}
