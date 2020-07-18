const logger = require('debug')

const log = (namespace, ...info) => {
  logger.enable(namespace)
  logger(namespace)(...info)
  console.log()
}

module.exports.new = (namespace, ...info) => log(namespace, ...info)
module.exports.info = (...info) => log('√', ...info)
module.exports.error = (...info) => log('✘', ...info)
