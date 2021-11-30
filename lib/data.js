// StarCraft internal server data example
// © MIT license

const fetch = require('node-fetch')

/**
 * Zips columns and rows together in an object.
 * 
 * This is done because the data returned by the StarCraft internal server only uses arrays,
 * plus an array of strings for what each of the array values mean.
 */
const zipColsRows = (cols, rows) => {
  return rows.map(row => {
    const data = {}
    for (let n = 0; n < row.length; ++n) {
      data[cols[n]] = row[n]
    }
    return data
  })
}

/**
 * Returns the ladder top 100 as an array of objects.
 * 
 * For testing purposes the 'avatar' value is removed, since it makes it hard to console.table().
 */
const getLadderTop100 = async (port) => {
  const req = await fetch(`http://127.0.0.1:${port}/web-api/v1/leaderboard/12931?offset=0&length=100`)
  const data = await req.json()
  // remove avatars for better display:
  const rows = data.rows.map(row => {
    row[9] = 'x'
    return row
  })
  return zipColsRows(data.columns, rows)
}

module.exports = {
  getLadderTop100
}
