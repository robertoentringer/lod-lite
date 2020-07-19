'use strict'

const find = (obj, tags) => {
  let val
  Object.keys(obj).some((k) =>
    tags.includes(k)
      ? (val = obj[k])
      : obj[k] && typeof obj[k] === 'object'
      ? (val = find(obj[k], tags))
      : val
  )
  return typeof val === 'object' ? find(val, ['$text']) : val
}

const deep = (entry, schema) =>
  Object.keys(schema).reduce((obj, key) => {
    const val = find(entry, schema[key])
    if (val) obj[key] = val
    return obj
  }, {})

const sequential = (entry, schema) =>
  schema.reduce((a, item) => (a = a[item]), Object.assign(entry))

module.exports = { find, deep, sequential }
