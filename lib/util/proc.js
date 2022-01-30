// StarCraft internal server data scraper
// © MIT license

const fetch = require('node-fetch')
const {execToText} = require('./exec')

const processNames = [
  '/StarCraft.exe', // Windows (maybe? untested.)
  'StarCraft.app/Contents/MacOS/StarCraft' // macOS
]

/**
 * Runs 'ps aux' and filters the output to find the StarCraft process.
 * 
 * If found, it returns only the pid as a number, or null otherwise.
 */
const getProcessID = async (procMatches = processNames) => {
  const procMatchesLc = procMatches.map(match => match.toLowerCase())
  const proc = (await execToText(['ps', 'aux']))
    .split('\n')
    .slice(1)
    .map(line => line.trim().split(/\s+/).map(segment => segment.trim()))
    .map(segments => ({user: segments[0], pid: segments[1], command: segments.slice(10).join(' ')}))
    .map(process => ({...process, match: procMatchesLc.map(name => process.command.toLowerCase().includes(name)).includes(true)}))
    .find(process => process.match)
  
  if (!proc) return null

  return Number(proc.pid)
}

/**
 * Returns an array of open ports for a given pid.
 * 
 * It's unknown which one of these ports runs the webserver.
 */
const getOpenPorts = async (pid) => {
  const ports = (await execToText(['lsof', '-aPi', '-p', pid])).trim()
    .split('\n')
    .slice(1)
    .map(line => line.trim().split(/\s+/).map(segment => segment.trim()))
    .map(segments => ({pid: segments[1], name: segments[8]}))
    .filter(port => port.name.includes('localhost'))
    .flatMap(port => port.name.match(/localhost:([0-9]+)/g).map(match => match.split(':')[1]))
    .map(port => Number(port))
  
  return [...new Set(ports)]
}

/**
 * Finds which one of a list of ports is the correct one by querying them all.
 * 
 * In my tests I've found that StarCraft usually runs three ports. One of them will time out,
 * one of them will throw ECONNREFUSED, and the other one works.
 * 
 * Only the port number is returned if found.
 */
const findWorkingPort = async ports => {
  if (ports.length === 1) return ports[0]

  const controller = new globalThis.AbortController()
  const port = await Promise.any(ports.map(async port => {
    const req = await fetch(`http://127.0.0.1:${port}/web-api/v1/leaderboard/12931?offset=0&length=100`, {signal: controller.signal})
    await req.json()
    return port
  }))
  controller.abort()

  return port
}

/**
 * Finds the StarCraft process ID and then finds the open port we need to use.
 */
const getProcessInfo = async (onlyGetProcessID = false) => {
  const proc = await getProcessID()

  if (!proc) {
    return [null, null]
  }

  if (onlyGetProcessID) {
    return [proc, null]
  }

  // Find the port being used by the API.
  const ports = await getOpenPorts(proc)
  const port = await findWorkingPort(ports)

  return [proc, port]
}

module.exports = {
  getProcessInfo,
  getProcessID,
  getOpenPorts,
  findWorkingPort
}
