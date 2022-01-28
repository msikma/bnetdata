// StarCraft internal server data scraper
// © MIT license

const {BnetAPI, getProcessInfo, outputSuccess, outputError, outputResult} = require('./lib')

/**
 * Short proof of concept that queries the StarCraft local web server and displays the ladder top 100.
 * 
 * First this searches for the pid of the StarCraft executable.
 * Then it checks to see what ports it's using (they're randomly picked at startup).
 * One of those ports is hosting the server.
 * Finally, it makes a query to the server requesting the ladder top 100, and displays it.
 */
const main = async (args) => {
  // Find the process ID and open port.
  const [proc, port] = await getProcessInfo(args.actionGetProcess)
  
  if (!proc) {
    return outputError('bnetdata: error: StarCraft is not running.')
  }

  if (args.actionGetProcess) {
    return outputSuccess(String(proc))
  }
  else if (args.actionGetPort) {
    return outputSuccess(String(port))
  }

  // All actions from this point use the Battle.net API.
  const bnetAPI = new BnetAPI(port, args.host, args.debug)

  if (args.actionGetLadderTop100) {
    return await outputResult(() => bnetAPI.getLadderStandings())
  }
  else if (args.actionGetPlayer) {
    return await outputResult(() => bnetAPI.getPlayerByID(args.actionGetPlayer))
  }
  else if (args.actionFindPlayers) {
    return await outputResult(() => bnetAPI.getPlayerNamesBySearch(args.actionFindPlayers))
  }

  return outputError('bnetdata: error: No action specified.')
}

module.exports = {
  main
}
