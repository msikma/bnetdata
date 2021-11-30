// StarCraft internal server data example
// © MIT license

const fetch = require('node-fetch')
const {execChar} = require('./exec')

const processNames = [
  'StarCraft.app/Contents/MacOS/StarCraft' // Mac OS X
]

/**
 * Runs 'ps aux' and filters the output to find the StarCraft process.
 * 
 * If found, it returns only the pid as a number, or null otherwise.
 */
const getProcess = async (procMatches = processNames) => {
  const proc = (await execChar(['ps', 'aux'])).stdout
    .split('\n')
    .slice(1)
    .map(line => line.trim().split(/\s+/).map(segment => segment.trim()))
    .map(segments => ({user: segments[0], pid: segments[1], command: segments.slice(10).join(' ')}))
    .map(process => ({...process, match: procMatches.map(name => process.command.includes(name)).includes(true)}))
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
  const ports = (await execChar(['lsof', '-aPi', '-p', pid])).stdout.trim()
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

  return Promise.any(ports.map(async port => {
    const req = await fetch(`http://127.0.0.1:${port}/web-api/v1/leaderboard/12931?offset=0&length=100`)
    await req.json()
    return port
  }))
}

module.exports = {
  getProcess,
  getOpenPorts,
  findWorkingPort
}
