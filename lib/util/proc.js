// StarCraft internal server data scraper
// © MIT license

const fetch = require('node-fetch')
const {execToText} = require('./exec')
const isWin = process.platform === "win32";

const processNames = [
  'StarCraft.exe', // Windows
  'StarCraft.app/Contents/MacOS/StarCraft' // macOS
]

/**
 * Runs 'ps aux' and filters the output to find the StarCraft process.
 * 
 * If found, it returns only the pid as a number, or null otherwise.
 */
const getProcessID = async (procMatches = processNames) => {
  const procMatchesLc = procMatches.map(match => match.toLowerCase())
  const command = isWin ? ['tasklist'] : ['ps', 'aux'];
  
  if (isWin) {
    var matcher = segments => ({user: segments[2], pid: segments[1], command: segments[0]})
  } else {
    var matcher = segments => ({user: segments[0], pid: segments[1], command: segments.slice(10).join(' ')});
  }

  const proc = (await execToText(command))
    .split(isWin ? '\r\n' : '\n')
    .slice(isWin ? 2 : 1)
    .map(line => line.trim().split(/\s+/).map(segment => segment.trim()))
    .map(matcher)
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
  const command = isWin ? ['netstat', '-on'] : ['lsof', '-aPi', '-p', pid];
  if (isWin) {
    var matcher = segments => ({pid: segments[4], name: segments[1].trim()})
  } else {
    var matcher = segments => ({pid: segments[1], name: segments[8].trim()})
  }
  const ports = (await execToText(command)).trim()
    .split(isWin ? '\r\n' : '\n')
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .filter(e => e.length == 5)
    .map(matcher)
    .filter(port => port.name.includes('localhost') || port.name.includes('127.0.0.1'))
    .flatMap(port => port.name.match(/[^:]+:([0-9]+)/g).map(match => match.split(':')[1]))
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
    const url = `http://127.0.0.1:${port}/web-api/v1/leaderboard/12931?offset=0&length=100`;
    const req = await fetch(url, {signal: controller.signal})
    var body = await req.json()
    if (body && Object.keys(body).length === 0 || body.success == false) {
      return Promise.reject(0)
    }
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
