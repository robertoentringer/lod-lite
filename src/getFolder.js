const path = require('path')
const fs = require('fs')

const log = require('./logger')
const { args } = require('./args.js')

const getFolder = (foldername = '') => {
  const dir = path.join(args.output, foldername)
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return dir
  } catch (err) {
    log.error(err)
  }
}

module.exports = getFolder
