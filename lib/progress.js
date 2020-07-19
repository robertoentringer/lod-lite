'use strict'

const readline = require('readline')

const newline = () => process.stdout.write('\n')
const exit = () => process.stdout.write('\n') && (process.exitCode = 1)

const hrstart = () => process.hrtime()
const hrend = () => process.hrtime(hrstart)
const time = () => new Date(hrend[0] * 1000).toISOString().substr(11, 8)

const print = (string) => {
  readline.clearLine(process.stdout)
  readline.cursorTo(process.stdout, 0)
  process.stdout.write(string + '')
}

const end = () => {
  const hrend = process.hrtime(hrstart)
  const time = new Date(hrend[0] * 1000).toISOString().substr(11, 8)
  readline.cursorTo(process.stdout, 0)
  readline.clearLine(process.stdout)
  console.info('⦿ Execution time: ', time)
  newline()
  process.exitCode = 1
}

module.exports = { print, newline, exit, hrstart, hrend, time, end }
