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
const infos = { fail: [], small: [], audio: 0 }
const items = {}

const args = minimist(process.argv.slice(2), {
  number: ['max'],
  string: ['output', 'schema', 'resource'],
  boolean: ['help', 'version', 'audio', 'single', 'pretty'],
  alias: {
    v: 'version',
    h: 'help',
    p: 'pretty',
    a: 'audio',
    s: 'single',
    r: 'resource',
    m: 'max',
    o: 'output',
    n: 'name',
    c: 'schema'
  },
  default: {
    max: 0,
    audio: false,
    output: '',
    name: '',
    resource: '',
    single: false,
    jsonobj: false,
    pretty: false,
    jsonarray: true,
    jsobj: false,
    jsarray: false,
    help: false,
    version: false,
    schema: path.join(__dirname, 'schema.js')
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
    text = `Help for the command-line ${pack.name} v.${pack.version}\n
    \r${pack.name} <options>

    \r-s, --single ........ Save single files
    \r-a, --audio ......... Convert audio from base64 to mp3 file
    \r-p, --pretty ........ Pretty format output files
    \r-r, --resource[] .... Optional URL to compressed lod file
    \r-c, --schema=[] ..... Path to schema file
    \r-n, --name=[] ....... Name of the data merged items
    \r-o, --output=[] ..... Set output folder
    \r-m, --max=[] ........ Number of items to be extracted. e.g. max=1000

    \r--jsonobj[].......... Extract items to json obj. Optional pass the name file
    \r--jsonarray[]........ Extract items to json array of objects. Optional pass the name file
    \r--jsobj[]............ Extract items to js obj. Optional pass the name file
    \r--jsarray[].......... Extract items to js array of objects. Optional pass the name file

    \r-h, --help ......... Output usage information
    \r--version .......... Output Lod-lite version`
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
  if (args.jsonobj) {
    const filename = `${typeof args.jsobj === 'string' ? args.jsobj : args.name + '-obj'}.json`
    const data = JSON.stringify(items, null, args.pretty ? 2 : 0)
    writeItems(path.join(getFolder(), filename), data, filename)
  }

  if (args.jsonarray) {
    const filename = `${
      typeof args.jsonarray === 'string' ? args.jsonarray : args.name + '-array'
    }.json`
    const data = JSON.stringify(Object.values(items), null, args.pretty ? 2 : 0)
    writeItems(path.join(getFolder(), filename), data, filename)
  }

  if (args.jsobj) {
    const filename = `${typeof args.jsobj === 'string' ? args.jsobj : args.name + '-obj'}.js`
    const data = `export default ${util.inspect(
      items,
      !args.pretty && { breakLength: 'Infinity' }
    )}`
    writeItems(path.join(getFolder(), filename), data, filename)
  }

  if (args.jsarray) {
    const filename = `${typeof args.jsarray === 'string' ? args.jsarray : args.name + '-array'}.js`
    const data = `export default ${util.inspect(Object.values(items), { breakLength: 'Infinity' })}`
    writeItems(path.join(getFolder(), filename), data, filename)
  }

  const hrend = process.hrtime(hrstart)
  const time = new Date(hrend[0] * 1000).toISOString().substr(11, 8)

  process.stdout.cursorTo(0)
  process.stdout.clearLine()

  console.info('Output folder: ', path.resolve(args.output), '\n')

  if (args.audio) console.info('Audio file folder:', path.resolve(getFolder('audio')), '\n')

  console.info('⦿ Execution time: ', time)
  console.info('√ Items extracted : ', Object.keys(items).length)

  if (infos.small.length) console.info('⚠︎ Mp3 very small: ', infos.small.length, infos.small)

  if (args.audio) {
    console.info('☊ Extracted audios: ', infos.audio)
  }

  if (infos.fail.length > 0) console.info('✕ Unable to save items: ', infos.fail.length, infos.fail)

  process.stdout.write('\n')

  process.exit()
}

const getFolder = (foldername = '') => {
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

  if (args.audio && 'audio' in obj) {
    const buff = new Buffer.from(obj.audio, 'base64')

    if (buff.length < 1000) infos.small.push(id)

    writeItems(path.join(getFolder('audio'), `${id}.mp3`), buff, id) &&
      delete obj.audio &&
      infos.audio++
  }

  if (args.single) {
    const dataJson = JSON.stringify(obj, null, 2)
    const dataJs = 'export default ' + util.inspect(obj, { breakLength: 'Infinity' })

    if (args.jsonarray || args.jsonobj)
      writeItems(path.join(getFolder('json'), `${id}.json`), dataJson, id)

    if (args.jsarray || args.jsobj) writeItems(path.join(getFolder('js'), `${id}.js`), dataJs, id)
  }

  items[id] = obj

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
    } else if (!/^application\/gzip/.test(contentType)) {
      error = new Error(
        'Invalid content-type.\n' + `Expected application/gzip but received ${contentType}`
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

  if (args.resource) {
    args.name = args.name || path.basename(args.resource, path.extname(args.resource))
  } else {
    const {
      resources: [{ url, format }]
    } = await opendata('resources/{url,format}')
    args.resource = url
    args.name = args.name || path.basename(url, `.${format}`)
  }

  args.output = args.output || args.name

  Array.from(['help', 'version']).forEach((cmd) => args[cmd] === true && helper(cmd))

  readResource()

  console.info('%sParsing from : %s %s', '\n', args.resource, '\n')
  console.info('Use schema file : %s %s', args.schema, '\n')
}

main()
