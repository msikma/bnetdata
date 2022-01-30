// StarCraft internal server data scraper
// © MIT license

const {fetchAsJSON, makeLogger, zipColsRows} = require('../util')
const {getRankData, getRaceData} = require('./meta')
const {processGameData} = require('./data')

/** Simple debugging logger that can be turned on/off. */
const log = makeLogger()

/**
 * Removes the #id section from a battletag if it's there.
 * 
 * For example, this turns 'Dada78641#1234' into 'Dada78641'.
 */
const cleanBattleTag = battletag => battletag.split('#')[0]

class BnetAPI {
  constructor(port, host = '127.0.0.1', doDebugging = false) {
    this.port = port
    this.host = host

    this.hasLeaderboardData = false

    this.gamemodes = null
    this.gateways = null
    this.leaderboards = null
    this.ladder = null

    log.setLogging(doDebugging)
  }

  /**
   * Returns a Battle.net API URL.
   */
  url(urlpath, query = {}, v = 1) {
    const url = new URL(`http://${this.host}:${this.port}/web-api/v${v}/${urlpath}`)
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v)
    }
    return String(url)
  }

  async apiCall(url) {
    log('apiCall', url)
    const data = await fetchAsJSON(url)
    return data
  }

  async apiCallZipped(url) {
    const data = await this.apiCall(url)
    return zipColsRows(data)
  }

  async getLeaderboards() {
    const url = this.url('leaderboard', {})
    const res = await this.apiCall(url)
    return [res.gamemodes, res.gateways, res.leaderboards]
  }

  async ensureLeaderboardData() {
    if (this.hasLeaderboardData) {
      return
    }

    // Get all basic game/ladder information.
    const [gamemodes, gateways, leaderboards] = await this.getLeaderboards()

    // Find the primary ladder (the global 1v1 leaderboard).
    // This ladder will have the gamemode_id for '1v1', and have the highest 'season_id' value.
    const id1v1 = Number(Object.entries(gamemodes).find(([_, mode]) => mode.name === '1v1')[0])
    const ladder = Object.values(leaderboards)
      .filter(board => board.gamemode_id === id1v1)
      .filter(board => board.name === 'Global')
      .sort((a, b) => b.season_id - a.season_id)[0]
    
    // Save all data.
    this.gamemodes = gamemodes
    this.gateways = gateways
    this.leaderboards = leaderboards
    this.ladder = ladder

    // We only need to do the above once.
    this.hasLeaderboardData = true
  }

  async getPlayerExtendedDataByID(playerID, gatewayID) {
    await this.ensureLeaderboardData()
    const playerTag = cleanBattleTag(playerID)
    const res = await this.apiCall(this.url(`aurora-profile-by-toon/${playerTag.trim()}/${gatewayID}`, {request_flags: 'scr_profile'}, 2))
    return res
  }

  async getPlayerRankByID(playerID, gatewayID) {
    await this.ensureLeaderboardData()
    const playerTag = cleanBattleTag(playerID)
    const res = await this.apiCall(this.url(`aurora-profile-by-toon/${this.ladder.id}/${playerTag.trim()}/${gatewayID}`))
    return res
  }

  async getPlayerByID(playerID) {
    // TODO: this requires an input length of 4 or greater. Build in an error if it's shorter.
    await this.ensureLeaderboardData()
    const res = await this.apiCall(this.url(`leaderboard-name-search/${this.ladder.id}/${playerID.trim()}`))
    if (!res.length) {
      throw new Error({message: `Player "${playerID}" not found.`})
    }
    const playerData = res[0]
    const ladderData = await this.getLadderStandings(playerData.rank - 1, 1)
    const playerLadderData = ladderData.data[0]
    const rankData = getRankData(playerLadderData.bucket)
    const raceData = getRaceData(playerLadderData.feature_stat)
    const extendedData = await this.getPlayerExtendedDataByID(playerID, playerLadderData.gateway_id)

    const matches = extendedData.game_results
      .map(game => processGameData(game, this.gateways))
      .sort((a, b) => b.match.date - a.match.date)

    const {wins, losses, disconnects, points, rank} = playerLadderData
    const extendedToonItem = extendedData.toons.find(toon => toon.toon === playerLadderData.toon && toon.gateway_id === playerLadderData.gateway_id)
    
    return {
      id: playerID,
      accountName: playerLadderData.battletag,
      name: playerLadderData.toon,
      updated: ladderData.updated,
      gatewayID: playerLadderData.gateway_id,
      auroraID: extendedData.aurora_id,
      accountNumber: extendedToonItem.guid,
      profile: {
        countryCode: extendedData.country_code
      },
      accounts: extendedData.toons.map(toon => ({
        gatewayID: toon.gateway_id,
        id: toon.guid,
        name: toon.toon
      })),
      matches,
      stats: {
        wins,
        losses,
        disconnects
      },
      rank: {
        ...rankData,
        points,
        rank,
      },
      race: raceData
    }
  }

  async getPlayerNamesBySearch(searchTerm) {
    await this.ensureLeaderboardData()
    const res = await this.apiCall(this.url(`leaderboard-name-search/${this.ladder.id}/${searchTerm.trim()}`))
    console.log(res)
    return {

    }
  }

  async getLadderUpdateTime() {
    await this.ensureLeaderboardData()
    return new Date(Number(this.ladder.last_update_time * 1000))
  }

  async getLadderStandings(offset = 0, length = 100) {
    await this.ensureLeaderboardData()
    const updated = await this.getLadderUpdateTime()
    const data = await this.apiCallZipped(this.url(`leaderboard/${this.ladder.id}`, {offset, length}))
    return {
      updated,
      data
    }
  }
}

module.exports = {
  BnetAPI
}
