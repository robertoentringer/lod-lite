'use strict'

const path = require('path')
const util = require('util')

const log = require('./logger')
const help = require('./help')
const items = require('./items')
const write = require('./write')
const folders = require('./folders')
const schema = require('./schema')
const resource = require('./resource')
const { base64 } = require('./base64')
const { args, fill } = require('./args')
const { deep, sequential } = require('./find')

const infos = { fail: [], small: [], files: 0 }
const entries = {}

const save = (entry) => {
  const id = sequential(entry, schema.meta.id).toString()

  log.update(id)

  base64(entry, schema.files, id)

  const item = deep(entry, schema.tags)

  if (args.single) {
    const dataJson = JSON.stringify(item, null, 2)
    const dataJs = 'export default ' + util.inspect(item, { breakLength: 'Infinity' })

    if (args.jsonarray || args.jsonobj) write(path.join(folders('json'), `${id}.json`), dataJson)
    if (args.jsarray || args.jsobj) write(path.join(folders('js'), `${id}.js`), dataJs)
  }

  entries[id] = item

  if (Object.keys(entries).length === args.max) log.clear() & end()
}

const end = () => {
  items(entries)
  log.info('Output folder : %s', path.resolve(args.output))
  log.info('Entries extracted : %s', Object.keys(entries).length)
  log.info('Extracted files : %s', infos.files)
  log.info('Fails : %s', infos.fail.length, infos.fail.join(','))
  log.exit()
}

const main = async () => {
  process.on('SIGINT', end)
  Array.from(['help', 'version']).forEach((cmd) => args[cmd] === true && help(cmd))
  await fill()
  log.info('Schema file : %s', args.schema)
  resource(args.resource, save, end)
}

main()

module.exports = { save, end, main }
