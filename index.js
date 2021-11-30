#!/usr/bin/env node
// StarCraft internal server data example
// © MIT license

const process = require('process')
const {getProcess, getOpenPorts, findWorkingPort, getLadderTop100} = require('./lib')

/**
 * Short proof of concept that queries the StarCraft local web server and displays the ladder top 100.
 * 
 * First this searches for the pid of the StarCraft executable.
 * Then it checks to see what ports it's using (they're randomly picked at startup).
 * One of those ports is hosting the server.
 * Finally, it makes a query to the server requesting the ladder top 100, and displays it.
 */
const main = async () => {
  const proc = await getProcess()
  if (!proc) {
    console.log('bnetdata: error: StarCraft is not running.')
    process.exit(1)
  }

  const ports = await getOpenPorts(proc)
  const port = await findWorkingPort(ports)

  const ladderTop100 = await getLadderTop100(port)
  
  console.log('StarCraft Remastered Ladder Top 100:')
  console.table(ladderTop100)
  process.exit(0)
}

main()
