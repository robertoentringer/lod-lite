const logger = require('./logger')

const opendata = require('lod-opendata')().catch((err) => logger.error(err))

const url = opendata.then(({ resources: [{ url = '' }] }) => url)

const filesize = opendata.then(({ resources: [{ filesize = '' }] }) => filesize)

const version = opendata.then(({ last_modified: version = '' }) => version)

const resources = opendata.then(({ resources = {} }) => resources)

const slug = version.then((string) => string.replace(/\D+/g, '-') + '-lod-opendata')

module.exports = { opendata, url, filesize, version, resources, slug }
