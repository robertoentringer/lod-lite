'use strict'

const path = require('path')

const getFolder = require('./folders')
const writeFile = require('./write')
const { find } = require('./find')

const save = (file) => {
  const buff = new Buffer.from(file.data, 'base64')
  const filepath = path.join(getFolder(file.folder), `${file.id}.${file.ext}`)
  writeFile(filepath, buff, file.id)
}

const base64 = (entry, schema, id) => {
  for (const file of schema) {
    const data = find(entry, file.tag)
    if (data) save(Object.assign(file, { data, id }))
  }
}

module.exports = { base64, save }
