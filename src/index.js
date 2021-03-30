/**
 * @file index.js
 * @description script for generating README.md from data
 */

const YAML = require('yaml')
const fs = require('fs').promises
const path = require('path')

const buildReadme = async () => {
  const dataFile = await fs.readFile(path.join(__dirname, 'data.yml'), 'utf-8')
  const data = YAML.parse(dataFile)
  console.log(data)
}

buildReadme()