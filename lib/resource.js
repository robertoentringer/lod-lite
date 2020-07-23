'use strict'

const { get } = require('https')
const tar = require('tar')
const flow = require('xml-flow')

const logger = require('./logger')
const schema = require('./include')('schema')

const resource = (url, onTag, onEnd) => {
  logger.info('Request from %s', url)

  try {
    get(url, (resp) => {
      const { statusCode } = resp
      const contentType = resp.headers['content-type']
      const test = !/^application\/gzip/.test(contentType)

      if (statusCode !== 200) logger.error('Request Failed. Status Code: % ', statusCode)
      else if (test)
        logger.error(
          'Content-type %s not supported.',
          contentType,
          'Expected %s.',
          'application/gzip'
        )

      const extract = tar.t({ filter: (file) => /\.xml$/.test(file) })

      extract.on('entry', (entry) =>
        flow(entry)
          .on(`tag:${schema.root}`, onTag)
          .on('end', onEnd)
          .on('error', (err) => logger.warn(err))
      )

      resp.pipe(extract)
    }).on('error', (err) => logger.error(err))
  } catch (err) {
    logger.error(err)
  }
}

module.exports = resource
