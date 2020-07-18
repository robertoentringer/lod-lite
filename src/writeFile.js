const { writeFileSync } = require('fs')

const log = require('./logger')

const writeFile = (filename, data) => {
  try {
    writeFileSync(filename, data)
    return true
  } catch (err) {
    log.error(err.message)
    return false
  }
}

module.exports = writeFile
