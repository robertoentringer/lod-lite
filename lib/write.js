'use strict'

const { writeFileSync } = require('fs')

const logger = require('./logger')

const write = (filename, data) => {
  try {
    writeFileSync(filename, data)
    return true
  } catch (err) {
    logger.warn(err)
    return false
  }
}

module.exports = write
