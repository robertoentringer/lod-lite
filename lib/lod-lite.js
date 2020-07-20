'use strict'

const path = require('path')
const util = require('util')

const logger = require('./logger')
const help = require('./help')
const items = require('./items')
const write = require('./write')
const folders = require('./folders')
const schema = require('./schema')
const resource = require('./resource')
const { base64 } = require('./base64')
const { args, fill } = require('./args')
const { deep, sequential } = require('./find')

const entries = {}

const taks = (entry) => {
  const id = sequential(entry, schema.meta.id).toString()

  logger.spinner(id)

  base64(entry, schema.files, id)

  const item = deep(entry, schema.tags)

  if (args.single) {
    const dataJson = JSON.stringify(item, null, 2)
    const dataJs = 'export default ' + util.inspect(item, { breakLength: 'Infinity' })

    if (args.jsonarray || args.jsonobj) write(path.join(folders('json'), `${id}.json`), dataJson)
    if (args.jsarray || args.jsobj) write(path.join(folders('js'), `${id}.js`), dataJs)
  }

  entries[id] = item

  if (Object.keys(entries).length === args.max) logger.clear() & end()
}

const end = () => {
  items(entries)
  logger.clear()
  logger.info('Output folder: %s', path.resolve(args.output))
  logger.info('Entries extracted: %s', Object.keys(entries).length)

  if (logger.status.files.length) logger.info('Extracted files: %s', logger.status.files.length)

  if (logger.status.fails.length)
    logger.fail('Write fails: %s', logger.status.fails.length, util.inspect(logger.status.fails))

  logger.end()
  logger.exit()
}

const init = async () => {
  logger.start()
  process.on('SIGINT', end)
  Array.from(['help', 'version']).forEach((cmd) => args[cmd] === true && help(cmd))
  await fill()
  logger.info('Schema file: %s', args.schema)
  resource(args.resource, taks, end)
}

module.exports = { taks, end, init }
