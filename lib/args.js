'use strict'

const path = require('path')
const minimist = require('minimist')
const opendata = require('lod-opendata')

const aliases = {
  v: 'version',
  h: 'help',
  p: 'pretty',
  s: 'single',
  r: 'resource',
  m: 'max',
  o: 'output',
  n: 'name',
  c: 'schema'
}

const defaults = {
  size: 1000,
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

const args = minimist(process.argv.slice(2), {
  number: ['max'],
  string: ['output', 'schema', 'resource', 'name'],
  boolean: ['help', 'version', 'single', 'pretty'],
  alias: aliases,
  default: defaults
})

const fill = async () => {
  if (args.resource) {
    args.name = args.name || path.basename(args.resource, path.extname(args.resource))
  } else {
    const { resources: [{ url, format } = {}] = [] } = await opendata('resources/{url,format}')
    update('resource', url)
    update('name', args.name || path.basename(url, `.${format}`))
  }
  update('output', args.output || args.name)
}

const update = (key, value) => {
  args[key] = args[Object.keys(aliases).find((k) => aliases[k] === key)] = value
}

module.exports = { aliases, defaults, args, fill, update }
