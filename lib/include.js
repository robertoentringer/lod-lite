'use strict'

const path = require('path')

const logger = require('./logger')
const { args } = require('./args.js')

const include = (filepath) => {
  filepath = path.resolve(args.schema)
  try {
    return require(filepath)
  } catch (err) {
    logger.error(err)
  }
}

module.exports = include
