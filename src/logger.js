const readline = require('readline')

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

module.exports.new = (prefix, ...info) => console.log(prefix, ...info, line)
module.exports.info = (...info) => console.log('√', ...info, line)
module.exports.error = (...info) => console.log('✘', ...info, line)
module.exports.fail = (...info) => console.log('✘', ...info, line) && exports.exit()

module.exports.update = (string) => {
  exports.clear()
  process.stdout.write(string)
}
