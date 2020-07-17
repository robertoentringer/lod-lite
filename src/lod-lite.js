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
const readline = require('readline')

const hrstart = process.hrtime()
const infos = { fail: [], small: [], files: 0 }
const items = {}

const args = minimist(process.argv.slice(2), {
  number: ['max'],
  string: ['output', 'schema', 'resource', 'name'],
  boolean: ['help', 'version', 'single', 'pretty'],
  alias: {
    v: 'version',
    h: 'help',
    p: 'pretty',
    s: 'single',
    r: 'resource',
    m: 'max',
    o: 'output',
    n: 'name',
    c: 'schema'
  },
  default: {
    max: 0,
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

    \r-s, --single ........ Save single files [default: false]
    \r-p, --pretty ........ Pretty format output files [default: false]
    \r-r, --resource[] .... Optional URL to compressed lod file [default: last lod resource from data.public.lu]
    \r-c, --schema=[] ..... Path to schema file [default:  schema.js file provides by package)
    \r-n, --name=[] ....... Name of the data merged items [default: name of lod file source]
    \r-o, --output=[] ..... Set output folder [default: name of lod file source]
    \r-m, --max=[] ........ Number of items to be extracted. [default: no limit]

    \r--jsonobj[].......... Extract items to json obj. Optional pass the name file [default: false]
    \r--jsonarray[]........ Extract items to json array of objects. Optional pass the name file [default: true]
    \r--jsobj[]............ Extract items to js obj. Optional pass the name file [default: false]
    \r--jsarray[].......... Extract items to js array of objects. Optional pass the name file [default: false]

    \r-h, --help ......... Output usage information
    \r--version .......... Output Lod-lite version`
  else if (cmd === 'version') text = `${pack.name} : ${pack.version}`

  process.stdout.write(`\n${text}\n\n`)

  process.exit()
}

const progress = (progress) => {
  readline.clearLine(process.stdout)
  readline.cursorTo(process.stdout, 0)
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

  readline.cursorTo(process.stdout, 0)
  readline.clearLine(process.stdout)

  console.info('Output folder: ', path.resolve(args.output), '\n')

  if (args.files) console.info('Files folder:', path.resolve(getFolder('files')), '\n')

  console.info('⦿ Execution time: ', time)
  console.info('√ Items extracted : ', Object.keys(items).length)

  if (infos.small.length) console.info('⚠︎ Mp3 very small: ', infos.small.length, infos.small)

  if (args.files) {
    console.info('⇱ Extracted files: ', infos.files)
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

const saveBase64 = (file) => {
  const buff = new Buffer.from(file.data, 'base64')

  if (buff.length < 1000) infos.small.push(file.id)

  const filepath = path.join(getFolder(file.folder), `${file.id}.${file.ext}`)

  writeItems(filepath, buff, file.id) && infos.files++
}

const getDeep = (entry, schema) =>
  Object.keys(schema).reduce((obj, key) => {
    const val = find(entry, schema[key])
    if (val) obj[key] = val
    return obj
  }, {})

const getSequential = (entry, schema) =>
  schema.reduce((a, item) => (a = a[item]), Object.assign(entry))

const getFiles = (entry, schema, id) => {
  for (const file of schema) {
    const data = find(entry, file.tag)
    if (data) saveBase64(Object.assign(file, { data, id }))
  }
}

const saveResource = (entry) => {
  //console.log(entry)

  //process.exit()

  const id = getSequential(entry, schema.meta.id).toString()

  //const version = getSequential(entry, schema.meta.version)

  //console.log(entry)

  progress(id)

  getFiles(entry, schema.files, id)

  const item = getDeep(entry, schema.tags)

  if (args.single) {
    const dataJson = JSON.stringify(item, null, 2)
    const dataJs = 'export default ' + util.inspect(item, { breakLength: 'Infinity' })

    if (args.jsonarray || args.jsonobj)
      writeItems(path.join(getFolder('json'), `${id}.json`), dataJson, id)

    if (args.jsarray || args.jsobj) writeItems(path.join(getFolder('js'), `${id}.js`), dataJs, id)
  }

  items[id] = item

  if (Object.keys(items).length === args.max) end()
}

const readResource = () => {
  const tarStream = tar.t({ filter: (path) => /\.xml$/.test(path) })

  tarStream.on('entry', (entry) =>
    flow(entry)
      .on(`tag:${schema.root}`, saveResource)
      .on('end', end)
      .on('error', (e) => {
        console.error(e, '\n')
        process.exit()
      })
  )

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

const normalizeArgs = async () => {
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
}

const main = async () => {
  process.on('SIGINT', end)

  await normalizeArgs()

  Array.from(['help', 'version']).forEach((cmd) => args[cmd] === true && helper(cmd))

  readResource()

  console.info('%sParsing from : %s %s', '\n', args.resource, '\n')
  console.info('Use schema file : %s %s', args.schema, '\n')
}

main()
