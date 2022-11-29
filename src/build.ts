import { dirname } from 'node:path'
import { build } from 'esbuild'
import { gzipSize } from 'gzip-size'

import type { PackageInfo } from './babel'

export interface PackageInfoWithSize extends PackageInfo {
  size: number
  gzip: number
}

export async function getSize({ path, name, line, string }: PackageInfo, external?: string[]) {
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
    minify: true,
    logLevel: 'silent',
  })
  const size = outputFiles[0].contents.byteLength
  const gzip = await gzipSize(outputFiles[0].text)
  return { errors, warnings, package: { path, name, line, string, size, gzip } as PackageInfoWithSize }
}
