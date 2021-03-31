/**
 * @file index.js
 * @description script for generating README.md from data
 */

const YAML = require('yaml')
const fs = require('fs').promises
const path = require('path')
const { walk, fetchReposInfo } = require('./utils')

const _generate = async (tree, level = 2) => {
  if (!tree) {
    return ''
  }
  level = Math.min(6, level) // head level
  const keys = Object.keys(tree).sort((a, b) => tree[a].starCount - tree[b].starCount)
  const indent = '#'.repeat(level) + ' '
  const result = (await Promise.all(keys.map(async key => {
    const { repos, label, children } = tree[key]
    const title = `${indent}${label}`
    const repoContent = repos.map(repo => {
      return `- [${repo.name}](https://github.com/${repo.name}) - ${repo.description}`
    })
    const childrenContent = await _generate(children, level + 1)
    return [title, repoContent, childrenContent].join('\n\n')
  }))).join('\n\n')
  return result
}

const generate = async (tree, level = 2) => {
  const fixedContent = await fs.readFile(path.join(__dirname, 'data', 'header.md'), 'utf-8')
  const dynamicContent = await _generate(tree, level)
  const markdownContent = [fixedContent, dynamicContent].join('\n\n')
  const markdownPath = path.join(__dirname, '..', 'README.md')
  await fs.writeFile(markdownPath, markdownContent)
}

const buildReadme = async () => {
  const dataFile = await fs.readFile(path.join(__dirname, 'data', 'source.yml'), 'utf-8')
  const tree = YAML.parse(dataFile)
  const repoSet = new Set()
  walk(tree, node => node.repos.forEach(repo => repoSet.add(repo)))
  const repos = Array.from(repoSet)
  const repoInfo = await fetchReposInfo(repos)
  walk(tree, (node, _fullpath, pNode) => {
    node.repos = node.repos.map(key => repoInfo[key])
    node.starCount = node.repos.reduce((res, repo) => res + repo.starCount, node.starCount || 0)
    if (pNode) {
      pNode.starCount = (pNode.starCount || 0) + node.starCount
    }
  })
  await generate(tree)
}

buildReadme()