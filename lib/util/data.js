// StarCraft internal server data scraper
// © MIT license

/** Returns true for objects (such as {} or new Object()), false otherwise. */
const isPlainObject = obj => obj != null && typeof obj === 'object' && obj.constructor === Object

/**
 * Zips columns and rows together in an object.
 * 
 * This is done because the data returned by the StarCraft internal server only uses arrays,
 * plus an array of strings for what each of the array values mean.
 */
const zipColsRows = (data) => {
  const {columns, rows} = data
  return rows.map(row => {
    const data = {}
    for (let n = 0; n < row.length; ++n) {
      data[columns[n]] = row[n]
    }
    return data
  })
}

module.exports = {
  zipColsRows,
  isPlainObject
}
