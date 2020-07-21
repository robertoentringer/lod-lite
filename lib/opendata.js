const { request } = require('https')

const logger = require('./logger')

const opendata = (url = 'https://data.public.lu/api/1/datasets/letzebuerger-online-dictionnaire') =>
  new Promise((resolve, reject) => {
    try {
      request(url, { headers: { 'X-Fields': 'resources' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
          resolve(opendata(res.headers.location))
        if (res.statusCode !== 200) reject(`${res.statusCode} : ${res.statusMessage} ${url}`)
        let rawdata = ''
        res.setEncoding('utf8')
        res
          .on('data', (data) => (rawdata += data))
          .on('end', () => {
            try {
              const jsondata = JSON.parse(rawdata)
              resolve(jsondata)
            } catch (err) {
              reject(err)
            }
          })
      })
        .on('error', reject)
        .end()
    } catch (err) {
      reject(err)
    }
  })

module.exports.opendata = async () =>
  await opendata().then(({ resources: [{ url }] }) => console.log(url), logger.error)
