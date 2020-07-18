const path = require('path')

const log = require('./logger')
const { args } = require('./args.js')

const schema = (() => {
  const filepath = path.resolve(args.schema)
  try {
    log.info('Load schema from %o', filepath)
    return require(filepath)
  } catch (err) {
    log.error(err.message)
    process.exit()
  }
})()

module.exports = schema
