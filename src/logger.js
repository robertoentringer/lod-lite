const readline = require('readline')
const chalk = require('chalk')

const regex = /%\w+/g
const line = '\n'

module.exports.newline = () => console.log(line)
module.exports.exit = () => process.exit()
module.exports.clear = () => {
  readline.clearLine(process.stdout)
  readline.cursorTo(process.stdout, 0)
}

module.exports.hrstart = () => process.hrtime()
module.exports.hrend = () => process.hrtime(exports.hrstart)
module.exports.time = () => new Date(exports.hrend[0] * 1000).toISOString().substr(11, 8)

module.exports.info = (...info) => exports.log(info, '√', 'green')
module.exports.warn = (...info) => exports.log(info, '✘', 'yellow')
module.exports.error = (...info) => exports.log(info, '✘', 'red') & exports.exit()

module.exports.log = (info, prefix, color) =>
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

module.exports.update = (string) => {
  exports.clear()
  process.stdout.write(string)
}
