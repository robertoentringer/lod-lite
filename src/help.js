const pack = require('../package.json')

const help = (cmd) => {
  let text

  if (cmd === 'help')
    text = `Help for the command-line ${pack.name} v.${pack.version}\n
    \r${pack.name} <options>

    \r-s, --single ........ Save single files [default: false]
    \r-p, --pretty ........ Pretty format output files [default: false]
    \r-r, --resource[] .... Optional URL to compressed lod file [default: last lod resource from data.public.lu]
    \r-c, --schema=[] ..... Path to schema file [default:  schema.js file provides by package)
    \r-n, --name=[] ....... Name of the data merged items [default: name of lod file source]
    \r-o, --output=[] ..... Set output folder [default: name of lod file source]
    \r-m, --max=[] ........ Number of items to be extracted. [default: no limit]

    \r--jsonobj[].......... Extract items to json obj. Optional pass the name file [default: false]
    \r--jsonarray[]........ Extract items to json array of objects. Optional pass the name file [default: true]
    \r--jsobj[]............ Extract items to js obj. Optional pass the name file [default: false]
    \r--jsarray[].......... Extract items to js array of objects. Optional pass the name file [default: false]

    \r-h, --help .......... Output usage information
    \r--version ........... Output Lod-lite version`
  else if (cmd === 'version') text = `${pack.name} : ${pack.version}`

  console.log(`\n${text}\n\n`)

  process.exit()
}

module.exports = help
