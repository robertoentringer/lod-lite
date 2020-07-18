const { get } = require('https')
const tar = require('tar')
const flow = require('xml-flow')

const log = require('./logger')
const schema = require('./getSchema.js')

const getResource = (url, onTag, onEnd) => {
  const tarStream = tar.t({ filter: (path) => /\.xml$/.test(path) })
  tarStream.on('entry', (entry) =>
    flow(entry)
      .on(`tag:${schema().root}`, onTag)
      .on('end', onEnd)
      .on('error', (e) => {
        log.error('Tar %o', e.message)
        process.exit()
      })
  )

  try {
    get(url, (resp) => {
      const { statusCode } = resp
      const contentType = resp.headers['content-type']
      log.info('Request from : %o', url)
      if (statusCode !== 200) log.error('Request Failed. Status Code: %o', statusCode)
      else if (!/^application\/gzip/.test(contentType))
        log.error('Content-type %o not supported. Expected %o', contentType, 'application/gzip')
      resp.pipe(tarStream)
    }).on('error', (e) => {
      log.erro('Http %o', e.message)
      process.exit()
    })
  } catch (err) {
    log.error(err.message)
  }
}

module.exports = (url, onTag, onEnd) => getResource(url, onTag, onEnd)
