import type { Message } from 'esbuild'
import type { PackageInfo } from './babel'
import type { PackageInfoWithSize } from './build'

import { getPackages } from './babel'
import { cache, getSize } from './build'
import { extractScriptFromHtml, guessLang, makeExternal } from './utils'

export type Lang = 'js' | 'ts' | 'jsx' | 'tsx' | 'vue' | 'svelte'

export interface ImportCostOptions {
  lang?: Lang
  external?: string[]
  esbuildPath?: string
  filter?: (path: string) => boolean
}

export interface ImportCostResult {
  errors: Message[]
  warnings: Message[]
  packages: PackageInfoWithSize[]
}

function yes() {
  return true
}

export async function importCost(path: string, code: string, { lang, external, esbuildPath, filter = yes }: ImportCostOptions = {}) {
  lang ??= guessLang(path)
  external ??= makeExternal(path)

  let packages: PackageInfo[] = []
  if (lang === 'svelte' || lang === 'vue') {
    const script = extractScriptFromHtml(code)
    if (script)
      packages = getPackages(path, script.source, { language: 'ts', lineOffset: script.line })
  }
  else {
    packages = getPackages(path, code, { language: lang })
  }
  packages = packages.filter(pkg => filter(pkg.name))

  const result: ImportCostResult = { errors: [], warnings: [], packages: [] }
  for await (const { errors, warnings, package: pkg } of packages.map(p => getSize(p, { esbuildPath, external }))) {
    result.errors = result.errors.concat(errors)
    result.warnings = result.warnings.concat(warnings)
    result.packages.push(pkg)
  }

  return result
}

export { cache }
