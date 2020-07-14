#! /usr/bin/env node

'use strict'

const opendata = require('lod-opendata')
const flow = require('xml-flow')
const { get } = require('https')
const path = require('path')
const tar = require('tar')
const fs = require('fs')
const pack = require('../package.json')
const util = require('util')
const minimist = require('minimist')

const hrstart = process.hrtime()
const infos = { fail: [], small: [], partial: 0, audio: 0 }
const items = {}

const args = minimist(process.argv.slice(2), {
  number: ['max'],
  string: ['output', 'schema', 'resource'],
  boolean: ['help', 'version', 'media'],
  alias: {
    v: 'version',
    h: 'help'
  },
  default: {
    max: 0,
    media: true,
    output: 'output-lod-lite',
    resource: '',
    help: false,
    version: false,
    schema: path.resolve('./src/schema.js')
  }
})

const schema = (() => {
  const filepath = path.resolve(args.schema)
  try {
    args.schema = filepath
    return require(filepath)
  } catch (err) {
    console.error('Cannot find schema file : "%s" %s', filepath, '\n')
    process.exit()
  }
})()

const helper = (cmd) => {
  let text

  if (cmd === 'help')
    text = `lod-lite <options>\n
    \rresource[] .... Optional URL to compressed lod file
    \rschema=[] ..... Path to schema file
    \rmax=[] ........ Number of items to be extracted. e.g. max=1000 (default: all)
    \rmedia ......... Convert audio from base64 to mp3 file (default: true)
    \rhelp .......... Output usage information
    \rversion ....... Output Lod-lite version`
  else if (cmd === 'version') text = `${pack.name} : ${pack.version}`

  process.stdout.write(`\n${text}\n\n`)

  process.exit()
}

const progress = (progress) => {
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(progress)
}

const end = () => {
  writeItems(path.join(args.output, `${args.output}.json`), JSON.stringify(items, null, 2))

  writeItems(
    path.join(args.output, `${args.output}.js`),
    'export default ' +
      util.inspect(items, {
        breakLength: 'Infinity'
      })
  )

  writeItems(
    path.join(args.output, `${args.output}.array.js`),
    'export default ' +
      util.inspect(Object.values(items), {
        breakLength: 'Infinity'
      })
  )

  writeItems(
    path.join(args.output, `${args.output}.array.json`),
    JSON.stringify(Object.values(items), null, 2)
  )

  const hrend = process.hrtime(hrstart)
  const time = new Date(hrend[0] * 1000).toISOString().substr(11, 8)

  process.stdout.cursorTo(0)
  process.stdout.clearLine()

  console.info('⦿ Execution time: ', time)
  console.info('√ Items extracted : ', Object.keys(items).length)

  if (infos.small.length) console.info('⚠︎ Mp3 very small: ', infos.small.length, infos.small)
  if (args.media) console.info('☊ Audio extracted: ', infos.audio)
  if (args.partial) console.info('? Items without all keys: ', infos.partial)
  if (infos.fail.length > 0) console.info('✕ Unable to save items: ', infos.fail.length, infos.fail)

  process.stdout.write('\n')

  process.exit()
}

const getFolder = (foldername) => {
  const dir = path.join(args.output, foldername)
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return dir
  } catch (err) {
    console.error(err.message, '\n')
    process.exit()
  }
}

const writeItems = (filename, data, id) => {
  try {
    fs.writeFileSync(filename, data)
    return true
  } catch (err) {
    infos.fail.push(id)
    return false
  }
}

const find = (obj, tags) => {
  let val

  Object.keys(obj).some((k) =>
    tags.includes(k)
      ? (val = obj[k])
      : obj[k] && typeof obj[k] === 'object'
      ? (val = find(obj[k], tags))
      : val
  )

  return typeof val === 'object' ? find(val, ['$text']) : val
}

const saveResource = (item) => {
  const id = item['lod:meta']['lod:id']

  progress(id)

  const obj = Object.keys(schema).reduce((obj, key) => {
    const val = find(item, schema[key])
    if (val) obj[key] = val
    return obj
  }, {})

  if (args.media && 'audio' in obj) {
    const buff = new Buffer.from(obj.audio, 'base64')

    if (buff.length < 1000) infos.small.push(id)

    writeItems(path.join(getFolder('audio'), `${id}.mp3`), buff, id) &&
      delete obj.audio &&
      infos.audio++
  }

  const dataJson = JSON.stringify(obj, null, 2)
  const dataJs = 'export default ' + util.inspect(obj, { breakLength: 'Infinity' })

  const saveJson = writeItems(path.join(getFolder('json'), `${id}.json`), dataJson, id)
  const saveJs = writeItems(path.join(getFolder('js'), `${id}.js`), dataJs, id)

  if (saveJson && saveJs) items[id] = obj

  if (Object.keys(items).length === args.max) end()
}

const readResource = () => {
  const tarStream = tar.t({ filter: (path) => /\.xml$/.test(path) })

  tarStream.on('entry', (entry) => flow(entry).on('tag:lod:item', saveResource).on('end', end))

  get(args.resource, (resp) => {
    const { statusCode } = resp
    const contentType = resp.headers['content-type']

    let error

    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`)
    } else if (!/^application\/x-tar/.test(contentType)) {
      error = new Error(
        'Invalid content-type.\n' + `Expected application/x-tar but received ${contentType}`
      )
    }
    if (error) console.error(error.message, '\n')

    resp.pipe(tarStream)
  }).on('error', (e) => {
    console.error(e.message, '\n')
    process.exit()
  })
}

const main = async () => {
  process.on('SIGINT', end)

  if (!args.resource) {
    const {
      resources: [{ url, format }]
    } = await opendata('resources/{url,format}')
    args.resource = url
    args.output = path.basename(url, `.${format}`)
  }

  Array.from(['help', 'version']).forEach((cmd) => args[cmd] === true && helper(cmd))

  readResource()

  console.info('%sParsing from : %s %s', '\n', args.resource, '\n')
  console.info('Use schema file : %s %s', args.schema, '\n')
}

main()
