'use strict'

const path = require('path')
const util = require('util')

const write = require('./write')
const folders = require('./folders')
const { args } = require('./args')

const items = (entries) => {
  if (args.jsonobj) {
    const filename = `${typeof args.jsobj === 'string' ? args.jsobj : args.name + '-obj'}.json`
    const data = JSON.stringify(entries, null, args.pretty ? 2 : 0)
    write(path.join(folders(), filename), data)
  }

  if (args.jsonarray) {
    const filename = `${
      typeof args.jsonarray === 'string' ? args.jsonarray : args.name + '-array'
    }.json`
    const data = JSON.stringify(Object.values(entries), null, args.pretty ? 2 : 0)
    write(path.join(folders(), filename), data)
  }

  if (args.jsobj) {
    const filename = `${typeof args.jsobj === 'string' ? args.jsobj : args.name + '-obj'}.js`
    const data = `export default ${util.inspect(
      entries,
      !args.pretty && { breakLength: 'Infinity' }
    )}`
    write(path.join(folders(), filename), data)
  }

  if (args.jsarray) {
    const filename = `${typeof args.jsarray === 'string' ? args.jsarray : args.name + '-array'}.js`
    const data = `export default ${util.inspect(Object.values(entries), {
      breakLength: 'Infinity'
    })}`
    write(path.join(folders(), filename), data, filename)
  }
}

module.exports = items
