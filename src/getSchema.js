const path = require('path')

const log = require('./logger')
const { args } = require('./args.js')

const schema = () => {
  const filepath = path.resolve(args.schema)
  try {
    return require(filepath)
  } catch (err) {
    log.fail(err.message)
  }
}

module.exports = schema
