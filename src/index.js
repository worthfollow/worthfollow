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
  // const useDetails = level === 2
  const useDetails = false
  const keys = Object.keys(tree).sort((a, b) => {
    if (tree[a].order !== tree[b].order) {
      return tree[a].order - tree[b].order
    }
    return tree[b].starCount - tree[a].starCount
  })
  const indent = '#'.repeat(level) + ' '
  const result = (await Promise.all(keys.map(async key => {
    const { repos, label, children, open } = tree[key]
    const title = `${indent}${label}`
    const summary = `<summary>${label}</summary>`
    const detailsHead = open ? `<details open>` : '<details>'
    const detailsTail = '</details>'
    const repoContent = repos.map(repo => {
      return `- [${repo.name}](https://github.com/${repo.name}#readme) - ${repo.description}`
    }).join('\n\n')
    const childrenContent = await _generate(children, level + 2)
    const result = useDetails ?
      [detailsHead, summary, title, repoContent, childrenContent, detailsTail].join('\n\n') :
      [title, repoContent, childrenContent].join('\n\n')
    return result
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

const getRepos = async () => {
  const result = {}
  const reposDir = path.join(__dirname, 'data', 'repos')
  const reposDirData = await fs.readdir(reposDir)
  for (const file of reposDirData) {
    const name = path.basename(file, '.yml')
    const fileContent = await fs.readFile(path.join(reposDir, file), 'utf-8')
    const data = YAML.parse(fileContent)
    data.children = data.repos.reduce((res, repo) => {
      const { name, category } = repo
      if (category) {
        res[category] = res[category] || { label: category, repos: [] }
        res[category].repos.push(name)
      }
      return res
    }, {})
    data.repos = data.repos.filter(item => !item.category).map(item => item.name)
    result[name] = data
  }
  return result
}

const buildReadme = async () => {
  const repoTree = await getRepos()
  console.log('repoTree is: ', repoTree)
  const repoSet = new Set()
  walk(repoTree, node => {
    node.repos.forEach(repo => repoSet.add(repo))
    node.order = node.order || Number.MAX_VALUE
   })
  const repos = Array.from(repoSet)
  const repoInfo = await fetchReposInfo(repos)
  walk(repoTree, (node, _fullpath, pNode) => {
    node.repos = node.repos.map(key => repoInfo[key]).sort((a, b) => b.starCount - a.starCount)
    node.starCount = node.repos.reduce((res, repo) => res + repo.starCount, node.starCount || 0)
    if (pNode) {
      pNode.starCount = (pNode.starCount || 0) + node.starCount
    }
  })
  await generate(repoTree)
}

buildReadme().catch(err => {
  console.error(err)
  process.exit(1)
})