/**
 * @file utils.js
 * @description utils 
 */

const { graphql } = require('@octokit/graphql')
const base62 = require('base62/lib/ascii')

const headers = {
  authorization: `Bearer ${process.env.GITHUB_TOKEN}`
}

/**
 * Fetch info for repos
 * @param {string[]} repos 
 * @returns {object} { [repoName]: { description: '', star: '', collaborators: [] } }
 */
exports.fetchReposInfo = async (repos) => {
  const queries = repos.map(repo => {
    const [owner, name] = repo.split('/')
    const key = 'A' + base62.encode(repo)
    return `
      ${key}: repository (owner: "${owner}", name: "${name}") {
        name,
        description
      }`
  })
  const query = `{${queries.join(',')}}`
  const queryRes = await graphql(query, { headers })
  console.log(queryRes)
}

const _walk = (tree, cb, pathes = []) => {
  if (!tree) {
    return
  }
  const keys = Object.keys(tree)
  keys.forEach(key => {
    const fullpath = [...pathes, key]
    const fullpathStr = fullpath.join('.')
    const node = tree[key]
    cb(node, fullpathStr)
    _walk(node.children, cb, fullpath)
  })
}

exports.walk = (tree, cb) => {
  _walk(tree, cb)
}