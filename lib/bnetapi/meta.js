// StarCraft internal server data scraper
// © MIT license

/** Internal IDs for each rank. */
const ranks = {
  7: {letter: 'S'},
  6: {letter: 'A'},
  5: {letter: 'B'},
  4: {letter: 'C'},
  3: {letter: 'D'},
  2: {letter: 'E'},
  1: {letter: 'F'},
  0: {letter: 'U'}
}

/** Additional information about each rank. */
const races = {
  zerg: {
    letter: 'Z',
    name: 'Zerg'
  },
  terran: {
    letter: 'T',
    name: 'Terran'
  },
  protoss: {
    letter: 'P',
    name: 'Protoss'
  }
}

const getRaceData = raceString => {
  if (!raceString) return null
  const race = races[raceString]
  if (!race) throw new Error(`Invalid race string: ${raceString}.`)
  return race
}

/**
 * Returns rank information for a given rank ID.
 */
const getRankData = bucketID => {
  if (!bucketID) return null
  const rank = ranks[bucketID]
  if (!rank) throw new Error({message: `Invalid rank ID: ${bucketID}.`})
  return rank
}

module.exports = {
  getRankData,
  getRaceData
}
