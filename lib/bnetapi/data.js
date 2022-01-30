// StarCraft internal server data scraper
// © MIT license

const {framesToMs, stripEscapeCodes, getSwatchFromSlotID} = require('sctoolsdata')

/** Returns whether a game was a ladder game or not. */
const isLadderGame = gameData => {
  // Apparently ladder games all have a unique GUID.
  return gameData.match_guid !== ''
}

/**
 * Restructures the data for a gateway.
 * 
 * Requires that the gateway ID is passed on as well, since it's not included in the object itself.
 */
const processGatewayData = (gatewayData, id) => {
  return {
    code: gatewayData.region,
    name: gatewayData.name,
    id
  }
}

/**
 * Rewrites the game data into a better format.
 */
const processGameData = (gameData, gateways) => {
  const players = gameData.players
    .filter(player => player.toon !== '')
    .map(player => ({
      isRequestedPlayer: Object.keys(player.stats).length > 0,
      result: player.result,
      name: player.toon
    }))
  const result = players.find(player => player.isRequestedPlayer).result
  return {
    map: {
      name: stripEscapeCodes(gameData.attributes.mapName).trim(),
      nameRaw: gameData.attributes.mapName
    },
    match: {
      date: new Date(gameData.create_time * 1000),
      id: gameData.game_id,
      ladderGuid: gameData.match_guid ? gameData.match_guid : null,
      isLadderGame: isLadderGame(gameData)
    },
    result,
    gateway: processGatewayData(gateways[gameData.gateway_id], gameData.gateway_id),
    players,
    clientVersion: gameData.client_version
  }
}

module.exports = {
  processGameData
}
