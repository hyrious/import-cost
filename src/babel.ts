import type { ParserPlugin } from '@babel/parser'

import * as t from '@babel/types'
import traverse from '@babel/traverse'
import { parse } from '@babel/parser'

const PARSE_PLUGINS: ParserPlugin[] = [
  'doExpressions',
  'objectRestSpread',
  ['decorators', { decoratorsBeforeExport: true }],
  'classProperties',
  'asyncGenerators',
  'functionBind',
  'functionSent',
  'dynamicImport',
]
const JS_PLUGINS: ParserPlugin[] = ['flow', 'jsx', ...PARSE_PLUGINS]
const TS_PLUGINS: ParserPlugin[] = ['typescript', ...PARSE_PLUGINS]
const TSX_PLUGINS: ParserPlugin[] = ['typescript', 'jsx', ...PARSE_PLUGINS]

export interface GetPackagesOptions {
  language?: 'ts' | 'tsx' | 'js' | 'jsx'
  lineOffset?: number
}

export interface PackageInfo {
  path: string
  name: string
  line: number
  string: string
}

export function getPackages(path: string, source: string, { language = 'js', lineOffset = 0 }: GetPackagesOptions = {}): PackageInfo[] {
  const plugins = language === 'ts' ? TS_PLUGINS : language === 'tsx' ? TSX_PLUGINS : JS_PLUGINS
  const ast = parse(source, { sourceType: 'module', plugins })
  const packages: { path: string; name: string; line: number; string: string }[] = []
  traverse.default(ast, {
    ImportDeclaration({ node }) {
      if (node.importKind !== 'type') {
        packages.push({
          path,
          name: node.source.value,
          line: node.loc!.end.line + lineOffset,
          string: compileImportString(node),
        })
      }
    },
    CallExpression({ node }) {
      if ('name' in node.callee && node.callee.name === 'require') {
        packages.push({
          path,
          name: getPackageName(node),
          line: node.loc!.end.line + lineOffset,
          string: compileRequireString(node),
        })
      }
      else if (node.callee.type === 'Import') {
        packages.push({
          path,
          name: getPackageName(node),
          line: node.loc!.end.line + lineOffset,
          string: compileImportExpressionString(node),
        })
      }
    },
  })
  return packages
}

function nameOrValue(node: t.Node) {
  if (t.isIdentifier(node))
    return node.name
  else if (t.isStringLiteral(node))
    return node.value
  else
    return ''
}

function compileImportString(node: t.ImportDeclaration) {
  let importSpecifiers: string | undefined, importString: string
  if (node.specifiers && node.specifiers.length > 0) {
    importString = ([] as t.ImportDeclaration['specifiers'])
      .concat(node.specifiers)
      .sort((s1, s2) => {
        if (t.isImportSpecifier(s1) && t.isImportSpecifier(s2))
          return nameOrValue(s1.imported).localeCompare(nameOrValue(s2.imported))
        return 0
      })
      .map((specifier, i) => {
        if (t.isImportNamespaceSpecifier(specifier)) {
          return `* as ${specifier.local.name}`
        }
        else if (t.isImportDefaultSpecifier(specifier)) {
          return specifier.local.name
        }
        else if (t.isImportSpecifier(specifier)) {
          if (!importSpecifiers)
            importSpecifiers = '{'

          importSpecifiers += nameOrValue(specifier.imported)
          if (node.specifiers[i + 1] && t.isImportSpecifier(node.specifiers[i + 1])) {
            importSpecifiers += ', '
            return undefined
          }
          else {
            // eslint-disable-next-line prefer-template
            const result = importSpecifiers + '}'
            importSpecifiers = undefined
            return result
          }
        }
        else {
          return undefined
        }
      })
      .filter(Boolean)
      .join(', ')
  }
  else {
    importString = '* as tmp'
  }
  return `import ${importString} from '${node.source.value}';
console.log(${importString.replace('* as ', '')});`
}

function compileRequireString(node: t.CallExpression) {
  return `require('${getPackageName(node)}')`
}

function compileImportExpressionString(node: t.CallExpression) {
  return `import('${getPackageName(node)}').then(res => console.log(res));`
}

function getPackageName(node: t.CallExpression) {
  return t.isTemplateLiteral(node.arguments[0])
    ? node.arguments[0].quasis[0].value.raw
    : nameOrValue(node.arguments[0])
}
