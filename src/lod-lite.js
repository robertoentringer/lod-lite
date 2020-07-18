#! /usr/bin/env node

'use strict'

const path = require('path')
const util = require('util')
const opendata = require('lod-opendata')

const log = require('./logger')
const help = require('./help.js')
const saveItems = require('./saveItems.js')
const writeFile = require('./writeFile.js')
const getFolder = require('./getFolder.js')
const schema = require('./getSchema.js')
const getResource = require('./getResource.js')
const { args, update: updateArg } = require('./args.js')
const { getFiles } = require('./fileFromBase64.js')
const { deep: getDeep, sequential: getSequential } = require('./deepFind.js')

const infos = { fail: [], small: [], files: 0 }
const entries = {}

const end = () => {
  saveItems(entries)

  log.info('Output folder: %o', path.resolve(args.output))
  log.info('Files folder : %o', path.resolve(getFolder('files')))

  log.info('Entries extracted : %o', Object.keys(entries).length)
  log.info('Extracted files : %d', infos.files)

  log.info('Unable to save entries:  %d', infos.fail.length, infos.fail)

  process.exit()
}

const saveEntry = (entry) => {
  const id = getSequential(entry, schema().meta.id).toString()

  log.info('Lod version: %o', getSequential(entry, schema().meta.version))

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

  if (Object.keys(entries).length === args.max) end()
}

const dynamicArgs = async () => {
  if (args.resource) {
    args.name = args.name || path.basename(args.resource, path.extname(args.resource))
  } else {
    const {
      resources: [{ url, format }]
    } = await opendata('resources/{url,format}')
    updateArg('resource', url)
    updateArg('name', args.name || path.basename(url, `.${format}`))
  }

  updateArg('output', args.output || args.name)
}

const main = () => {
  process.on('SIGINT', end)

  Array.from(['help', 'version']).forEach((cmd) => args[cmd] === true && help(cmd))

  const init = () => {
    log.info('Load schema from %o', args.schema)
    getResource(args.resource, saveEntry, end)
  }

  dynamicArgs().then(init)
}

main()
