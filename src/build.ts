import { dirname } from 'node:path'

import type { Message } from 'esbuild'
import { build } from 'esbuild'
import { gzipSize } from 'gzip-size'

import type { PackageInfo } from './babel'

export interface PackageInfoWithSize extends PackageInfo {
  size: number
  gzip: number
}

export interface GetSizeResult {
  errors: Message[]
  warnings: Message[]
  package: PackageInfoWithSize
}

export const cache = new Map<string, GetSizeResult>()

export async function getSize({ path, name, line, string }: PackageInfo, external?: string[]): Promise<GetSizeResult> {
  if (cache.has(string))
    return cache.get(string)!

  const { errors, warnings, outputFiles } = await build({
    stdin: {
      contents: string,
      resolveDir: dirname(path),
      sourcefile: path,
    },
    bundle: true,
    format: 'esm',
    external,
    write: false,
    outdir: 'dist', // make multi output work
    allowOverwrite: true, // don't worry, `write: false` will work
    minify: true,
    logLevel: 'silent',
  }).catch(convertError)

  let size, gzip
  if (outputFiles.length > 0) {
    size = outputFiles[0].contents.byteLength
    gzip = await gzipSize(outputFiles[0].text)
  }
  else {
    size = gzip = 0
  }
  return { errors, warnings, package: { path, name, line, string, size, gzip } }
}

function convertError(e: any) {
  return {
    errors: e.errors || [],
    warnings: e.warnings || [],
    outputFiles: [],
  }
}
