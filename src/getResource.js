const { get } = require('https')
const tar = require('tar')
const flow = require('xml-flow')

const log = require('./logger')
const schema = require('./getSchema.js')

const getResource = (url, onTag, onEnd) => {
  const tarStream = tar.t({ filter: (file) => /\.xml$/.test(file) })

  tarStream.on('entry', (entry) =>
    flow(entry)
      .on(`tag:${schema().root}`, onTag)
      .on('end', onEnd)
      .on('error', (err) => log.warn(err.message))
  )

  try {
    get(url, (resp) => {
      const { statusCode } = resp
      const contentType = resp.headers['content-type']
      const test = !/^application\/gzip/.test(contentType)

      log.info('Request from %s', url)

      if (statusCode !== 200) log.error('Request Failed. Status Code : % ', statusCode)
      else if (test)
        log.error('Content-type %s not supported.', contentType, 'Expected %s.', 'application/gzip')

      resp.pipe(tarStream)
    }).on('error', (err) => log.error(err.message))
  } catch (err) {
    log.error(err.message)
  }
}

module.exports = (url, onTag, onEnd) => getResource(url, onTag, onEnd)
