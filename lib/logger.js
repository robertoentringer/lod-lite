'use strict'

const readline = require('readline')
const chalk = require('chalk')

const regex = /%\w+/g
const line = '\n'

const newline = () => console.log(line)
const exit = () => process.exit()
const clear = () => readline.clearLine(process.stdout) & readline.cursorTo(process.stdout, 0)
const hrstart = () => process.hrtime()
const hrend = () => process.hrtime(hrstart)
const time = () => new Date(hrend[0] * 1000).toISOString().substr(11, 8)
const update = (info) => clear() & process.stdout.write(info)
const info = (...info) => log(info, '√', 'green')
const warn = (...info) => log(info, '✘', 'yellow')
const error = (...info) => log(info, '✘', 'red') & exit()

const log = (info, prefix, color) =>
  console.log(
    chalk[color](prefix),
    info
      .map((item, i) => {
        if (regex.test(item)) {
          item = item.replace(regex, chalk[color](info[i + 1]))
          delete info[i + 1]
        }
        return item
      })
      .filter(Boolean)
      .join(' '),
    line
  )

module.exports = { newline, exit, clear, hrstart, hrend, time, update, info, warn, error, log }
