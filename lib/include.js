'use strict'

const path = require('path')

const log = require('./logger')
const { args } = require('./args.js')

const include = (filepath) => {
  filepath = path.resolve(args.schema)
  try {
    return require(filepath)
  } catch (err) {
    log.error(err)
  }
}

module.exports = (filepath) => include(filepath)
