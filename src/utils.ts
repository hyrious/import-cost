import fs from 'node:fs'
import builtinModules from 'builtin-modules/static.js'
import escalade from 'escalade/sync'

import type { Lang } from './index'

const languages = new Set<string | undefined>(['js', 'ts', 'jsx', 'tsx', 'vue', 'svelte'])

export function guessLang(path: string) {
  const ext = path.split('.').pop()
  if (languages.has(ext))
    return ext as Lang
  else
    return 'js'
}

export function makeExternal(path: string) {
  const pkg = escalade(path, (_dir, names) => {
    if (names.includes('package.json'))
      return 'package.json'
  })
  if (pkg) {
    const { peerDependencies } = JSON.parse(fs.readFileSync(pkg, 'utf8'))
    return builtinModules.concat(Object.keys({ ...peerDependencies }))
  }
  else {
    return builtinModules.slice()
  }
}

export function extractScriptFromHtml(html: string) {
  const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  if (script) {
    const source = script[1]
    const line = html.slice(0, script.index).split('\n').length
    return { source, line }
  }
  else {
    return null
  }
}
