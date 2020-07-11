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
const util = require('util')

const hrstart = process.hrtime()
const infos = { fail: [], small: [], partial: 0, audio: 0 }
const items = {}
let count = 0
let outputFolder

const args = (() => {
  const defaults = {
    partial: false,
    max: false,
    split: true,
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
    \rpartial ....... Include in extract data items without all traductions (default: false)
    \rmax=[] ........ Number of items to be extracted. e.g. max=1000 (default: all)
    \rsplit ......... Convert audio from base64 to mp3 and save in the file (default: true)
    \rhelp .......... Output usage information
    \rversion ....... Output Lod-lite version`
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
  writeItems(path.join(outputFolder, `${outputFolder}.json`), JSON.stringify(items, null, 2), false)

  const hrend = process.hrtime(hrstart)
  const time = new Date(hrend[0] * 1000).toISOString().substr(11, 8)

  process.stdout.cursorTo(0)
  process.stdout.clearLine()

  console.info("⦿ Execution time: ", time)
  console.info("√ Items extracted : ", Object.keys(items).length)

  if (infos.small.length) console.info("⚠︎ Mp3 very small: ", infos.small.length, infos.small)
  if (args.split) console.info("☊ Audio extracted: ", infos.audio)
  if (args.partial) console.info("? Items without all keys: ", infos.partial)
  if (infos.fail.length > 0) console.info("✕ Unable to save items: ", infos.fail.length, infos.fail)

  process.stdout.write("\n")

  process.exit()
}

const mkdir = dir => {
  try {
    if(!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
    return dir
  } catch (err) {
    console.error(err.message, "\n")
    process.exit()
  }
}

const getFolder = dir => mkdir(path.join(outputFolder, dir))

const writeItems = (filename, data, id) => {
  try {
    fs.writeFileSync(filename, data)
    return true
  } catch (err) {
    infos.fail.push(id)
    return false
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
  const obj = Object.keys(lod).reduce((obj, key) => ((obj[key] = find(item, lod[key])), obj), {})
  const hasAllKeys = Object.values(obj).filter(Boolean).length === Object.keys(lod).length

  if (!args.partial && !hasAllKeys) return
  else if (!hasAllKeys) infos.partial++

  if (args.split && "audio" in obj) {
    const buff = new Buffer.from(obj.audio, "base64")

    if (buff.length < 1000) infos.small.push(id)

    writeItems(path.join(getFolder('audio'), `${id}.mp3`), buff, id)
      && delete obj.audio && infos.audio++
  }

  const dataJson = JSON.stringify(obj, null, 2)
  const dataJs = 'export default ' + util.inspect(obj, { breakLength: "Infinity" })

  const saveJson = writeItems(path.join(getFolder('json'), `${id}.json`), dataJson, id)
  const saveJs = writeItems(path.join(getFolder('js'), `${id}.js`), dataJs, id)

  if (saveJson && saveJs) items[id] = obj

  progress(id)

  if (++count === args.max) end()
}

const init = async () => {
  process.on("SIGINT", end)

  Array.from(["help", "version"]).forEach(cmd => args[cmd] === true && helper(cmd))

  const {
    resources: [{ url, format }]
  } = await opendata("resources/{url,format}")

  outputFolder = path.basename(url, `.${format}`)

  const tarStream = tar.t({ filter: path => /\.xml$/.test(path) })

  tarStream.on("entry", entry =>
    flow(entry)
      .on("tag:lod:item", extract)
      .on("end", end)
  )

  get(url, resp => resp.pipe(tarStream))
}

init()
