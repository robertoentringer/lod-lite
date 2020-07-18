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
      .on('error', (err) => log.fail(err.message))
  )

  try {
    get(url, (resp) => {
      const { statusCode } = resp
      const contentType = resp.headers['content-type']
      const test = !/^application\/gzip/.test(contentType)

      log.info('Request from :', url)

      if (statusCode !== 200) log.fail('Request Failed. Status Code :', statusCode)
      else if (test)
        log.fail(`Content-type '${contentType}' not supported.`, "Expected 'application/gzip'.")

      resp.pipe(tarStream)
    }).on('error', (err) => log.fail(err.message))
  } catch (err) {
    log.fail(err.message)
  }
}

module.exports = (url, onTag, onEnd) => getResource(url, onTag, onEnd)
