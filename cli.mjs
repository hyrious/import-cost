#!/usr/bin/env node
import fs from 'node:fs'
import sade from 'sade'
import prettyBytes from 'pretty-bytes'

import { importCost } from './dist/index.mjs'

function node_modules_only(path) {
  return /^[@a-z]/.test(path)
}

async function main(path, opts) {
  const external = opts.external ? opts.external.split(',') : undefined
  const { packages } = await importCost(path, fs.readFileSync(path, 'utf8'), { external, filter: node_modules_only })
  const headers = ['Package', 'Cost', 'Where']
  const widths = [7, 4, 5]
  const rows = packages.map((pkg) => {
    const row = [pkg.name, `${prettyBytes(pkg.size)} (gzipped: ${prettyBytes(pkg.gzip)})`, `${pkg.path}:${pkg.line}`]
    row.forEach((col, i) => {
      widths[i] = Math.max(widths[i], col.length)
    })
    return row
  })
  const table = [headers, ...rows]
  table.forEach(row => console.log(row.map((col, i) => col.padEnd(widths[i])).join('  ')))
}

function main_(path, opts) {
  main(path, opts).catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}

sade('import-cost <path>', true)
  .version(JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url))).version)
  .describe('Calculate the cost of importing a module')
  .option('--external', 'Comma-separated list of external modules')
  .action(main_)
  .parse(process.argv)
