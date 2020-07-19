#! /usr/bin/env node

'use strict'

const path = require('path')
const util = require('util')

const log = require('./logger')
const help = require('./help.js')
const saveItems = require('./saveItems.js')
const writeFile = require('./writeFile.js')
const getFolder = require('./getFolder.js')
const schema = require('./getSchema.js')
const getResource = require('./getResource.js')
const { args, fill } = require('./args.js')
const { getFiles } = require('./fileFromBase64.js')
const { deep: getDeep, sequential: getSequential } = require('./deepFind.js')

const infos = { fail: [], small: [], files: 0 }
const entries = {}

const saveEntry = (entry) => {
  const id = getSequential(entry, schema().meta.id).toString()

  log.update(id)

  getFiles(entry, schema().files, id)

  const item = getDeep(entry, schema().tags)

  if (args.single) {
    const dataJson = JSON.stringify(item, null, 2)
    const dataJs = 'export default ' + util.inspect(item, { breakLength: 'Infinity' })

    if (args.jsonarray || args.jsonobj)
      writeFile(path.join(getFolder('json'), `${id}.json`), dataJson)

    if (args.jsarray || args.jsobj) writeFile(path.join(getFolder('js'), `${id}.js`), dataJs)
  }

  entries[id] = item

  if (Object.keys(entries).length === args.max) {
    log.clear()
    end()
  }
}

const end = () => {
  saveItems(entries)

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
  getResource(args.resource, saveEntry, end)
}

main()
