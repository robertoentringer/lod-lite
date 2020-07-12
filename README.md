# Lod-lite

A NPM package to extract data of the Lëtzebuerger Online Dictionnaire (LOD).

Author: [Roberto Entringer](https://robertoentringer.com)<br>
License: MIT<br>
Npm package: https://www.npmjs.com/package/lod-lite<br>
Github: https://github.com/robertoentringer/lod-lite#readme

## Installation

```shell
$ npm install lod-lite
```

## Usage

Call script from the **package.json**:

```json
"scripts": {
  "extract": "lod-lite"
}
```

Call script from the **terminal**:

```shell
$ npx lod-lite
```

## XML Schema

Schema: https://www.lod.lu/schema/lod-opendata.xsd

## Example of schema file

```js
module.exports = {
  target: [
    'lod:renvoi-adj',
    'lod:renvoi-adv',
    'lod:renvoi-art',
    'lod:renvoi-conj',
    'lod:renvoi-int',
    'lod:renvoi-part',
    'lod:renvoi-prep',
    'lod:renvoi-pron',
    'lod:renvoi-subst',
    'lod:renvoi-vrb'
  ],
  id: ['lod:id'],
  lu: ['lod:item-adresse'],
  de: [
    'lod:trad-all-domin',
    'lod:equiv-trad-all',
    'lod:trad-all-subord',
    'lod:eta-explicite',
    'lod:rs-eta-presente'
  ],
  fr: [
    'lod:trad-fr-domin',
    'lod:equiv-trad-fr',
    'lod:trad-fr-subord',
    'lod:etf-explicite',
    'lod:rs-etf-presente'
  ],
  pt: [
    'lod:trad-pt-domin',
    'lod:equiv-trad-po',
    'lod:trad-pt-subord',
    'lod:etp-explicite',
    'lod:rs-etp-presente'
  ],
  en: [
    'lod:trad-en-domin',
    'lod:equiv-trad-en',
    'lod:trad-en-subord',
    'lod:ete-explicite',
    'lod:rs-ete-presente'
  ],
  audio: ['lod:audio']
}
```

## Data source

Data from the "Lëtzebuerger Online Dictionnaire" (LOD)

Website: http://www.lod.lu<br>
Source: https://data.public.lu/fr/datasets/letzebuerger-online-dictionnaire/<br>
Licence: Creative Commons Zero (CC0)

[![screenshot.png](screenshot.png)](https://data.public.lu/fr/datasets/letzebuerger-online-dictionnaire/)
