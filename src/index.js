/**
 * @file index.js
 * @description script for generating README.md from data
 */

const YAML = require('yaml')
const fs = require('fs').promises
const path = require('path')
const { walk, fetchReposInfo } = require('./utils')

const buildReadme = async () => {
  const dataFile = await fs.readFile(path.join(__dirname, 'data.yml'), 'utf-8')
  const data = YAML.parse(dataFile)
  const repoSet = new Set()
  walk(data, node => node.repos.forEach(repo => repoSet.add(repo)))
  const repos = Array.from(repoSet)
  console.log('repos: ', repos)
  const repoInfo = await fetchReposInfo(repos)
  console.log('info: ', repoInfo)
}

buildReadme()