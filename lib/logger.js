'use strict'

const util = require('util')
const readline = require('readline')
const chalk = require('chalk')

const regex = /%\w+/g
const line = '\n'
const status = { fails: [], files: [], entries: {} }

const br = () => console.log(line)
const clear = () => readline.clearLine(process.stdout) && readline.cursorTo(process.stdout, 0)
const start = () => console.time(chalk.blue('Progress'))
const end = () => console.timeLog(chalk.blue('Progress'), line)
const exit = () => end() & process.exit()
const die = (msg = '') => log([util.inspect(msg)], '?', 'magenta') & exit()

const spinner = (info) => clear() && process.stdout.write(info)
const info = (...info) => log(info, '√', 'green')
const warn = (...info) => log(info, '⌾', 'yellow')
const fail = (...info) => log(info, '✘', 'red')
const error = (...info) => log(info, '✘', 'red') & exit()

const log = (info = [], prefix = '', color = '') =>
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

module.exports = { br, exit, die, clear, start, end, spinner, info, warn, fail, error, status, log }
