/**
 * @file utils.js
 * @description utils 
 */

const { graphql } = require('@octokit/graphql')
const { customAlphabet } = require('nanoid/non-secure')
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_', 10)

const headers = {
  authorization: `Bearer ${process.env.GITHUB_TOKEN}`
}

/**
 * Fetch info for repos
 * @param {string[]} repos 
 * @returns {object} { [repoName]: { description: '', star: '', collaborators: [] } }
 */
exports.fetchReposInfo = async (repos) => {
  const keyMap = {}
  const queries = repos.map(repo => {
    const [owner, name] = repo.split('/')

    let key = nanoid()
    while(keyMap[key]) {
      key = nanoid()
    }

    keyMap[key] = repo
    return `
      ${key}: repository (owner: "${owner}", name: "${name}") {
        name,
        description
      }`
  })
  const query = `{${queries.join(',')}}`
  console.log('query is: ', query)
  const queryRes = await graphql(query, { headers })
  console.log('queryRes is: ', queryRes)
  const result = Object.keys(queryRes.data).reduce((res, key) => ({
    ...res,
    [keyMap[key]]: queryRes.data[key]
  }))
  console.log('result is: ', result)
  return result
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