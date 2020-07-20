'use strict'

const { writeFileSync } = require('fs')
const path = require('path')

const logger = require('./logger')

const write = (filename, data) => {
  try {
    writeFileSync(filename, data)
    return true
  } catch (err) {
    logger.warn(err)
    logger.fails.push(path.basename(filename))
    return false
  }
}

module.exports = write
