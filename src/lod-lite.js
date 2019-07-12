#! /usr/bin/env node

"use strict"

const opendata = require("lod-opendata")
const flow = require("xml-flow")
const { get } = require("https")
const path = require("path")
const tar = require("tar")
const fs = require("fs")
const lod = require("./schema")
const pack = require("../package.json")

const hrstart = process.hrtime()
const infos = { total: 0, fail: [], partial: 0 }
const items = {}
let count = 0
let basedir

const args = (() => {
  const defaults = {
    single: true,
    partial: false,
    split: false,
    max: false,
    help: false,
    version: false
  }
  process.argv.slice(2).forEach(i => {
    let [k, v] = i.split("=")
    if (k in defaults)
      defaults[k] = !isNaN(v) || k == "max" ? Math.abs(v) || false : v === undefined || v === "true"
  })
  return defaults
})()

const helper = cmd => {
  let output
  if (cmd === "help")
    output = `lod-lite <options>\n
    \rsingle ........ Extract all data to a single json file
    \rpartial ....... Include in extract data items without all traductions
    \rslit .......... Extract data in separate files
    \rmax=[] ........ Number of items to be extracted. e.g. max=1000
    \rhelp .......... Ouput usage information
    \rversion ....... Ouput Lod-lite version`
  else if (cmd === "version") output = `${pack.name} : ${pack.version}`

  process.stdout.write(`\n${output}\n\n`)
  process.exit()
}

const progress = progress => {
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(progress)
}

const end = () => {
  writeFile(path.join(basedir, `${basedir}.json`), JSON.stringify(items, null, 2))

  const hrend = process.hrtime(hrstart)
  const time = new Date(hrend[0] * 1000).toISOString().substr(11, 8)

  process.stdout.cursorTo(0)
  process.stdout.clearLine()

  console.info("⦿ Execution time: ", time)
  console.info("√ Files created: ", infos.total)
  console.info("? Items without all keys: ", infos.partial)

  if (infos.fail.length > 0)
    console.info("☓ Unable to save files:: ", infos.fail.length, infos.fail)

  process.stdout.write("\n")

  process.exit()
}

const mkdir = basedir => {
  try {
    if (!fs.existsSync(basedir)) fs.mkdirSync(basedir)
    return basedir
  } catch (err) {
    console.error(err.message, "\n")
    process.exit()
  }
}

const writeFile = (filename, item) => {
  try {
    fs.writeFileSync(filename, item)
    infos.total++
  } catch (err) {
    infos.fail.push(path.basename(filename, ".json"))
  }
}

const find = (obj, tags) => {
  let val
  Object.keys(obj).some(k =>
    tags.includes(k)
      ? (val = obj[k])
      : obj[k] && typeof obj[k] === "object"
      ? (val = find(obj[k], tags))
      : val
  )
  return typeof val === "object" ? find(val, ["$text"]) : val
}

const extract = item => {
  const id = item["lod:meta"]["lod:id"]
  const filename = path.join(basedir, `${id}.json`)
  const obj = Object.keys(lod).reduce((obj, key) => ((obj[key] = find(item, lod[key])), obj), {})

  const hasAllKeys = Object.values(obj).filter(Boolean).length === Object.keys(lod).length

  if (!args.partial && !hasAllKeys) return
  else if (!hasAllKeys) infos.partial++

  if (args.split) writeFile(filename, JSON.stringify(obj, null, 2))

  items[id] = obj

  progress(id)

  if (++count === args.max) end()
}

;(async () => {
  process.on("SIGINT", end)

  Array.from(["help", "version"]).forEach(cmd => args[cmd] === true && helper(cmd))

  const {
    resources: [{ url, format }]
  } = await opendata("resources/{url,format}")

  basedir = mkdir(path.basename(url, `.${format}`))

  const tarStream = tar.t({ filter: path => /\.xml$/.test(path) })
  tarStream.on("entry", entry =>
    flow(entry)
      .on("tag:lod:item", extract)
      .on("end", end)
  )

  get(url, resp => resp.pipe(tarStream))
})()
