# @hyrious/import-cost

> Get imported code size of a package.

This package is heavily inspired by [import-cost](https://github.com/wix/import-cost).

## Usage

### CLI

```bash
> npx @hyrious/import-cost file.ts

Package   Cost     Where
lodash    70 kiB   file.ts:2
```

### API

#### importCost(path, code, options?)

```js
import { importCost } from '@hyrious/import-cost'
const result = await importCost('file.ts', `
  import { uniqueId } from 'lodash'
`)
// => { errors: [], warnings: [], packages: [
//   { path: 'file.ts', name: 'lodash', line: 2, size: 70000, gzip: 70000 }
// ] }
```

- `path` {String} The path to the file, this is used for looking up the `node_modules` folder.
- `code` {String} The contents of the file.
- `options` {Object}
  - `lang` {String} Override the language infered from file extension. Available values: `js`, `ts`, `jsx`, `tsx`, `vue`, `svelte`.
  - `external` {String[]} Override packages to be excluded from the bundle. By default, all peer dependencies scanned from the package.json indicated by `path` will be excluded.
- Returns: {Promise&lang;Object&rang;}
  - `errors`, `warnings` {Object[]} Passed through from [esbuild](https://esbuild.github.io/api/#build-api).
  - `packages` {Object[]}
    - `path` {String} The path to the file, same as the input argument.
    - `name` {String} The name of the analyzed package.
    - `line` {Number} The line number of the import statement.
    - `size` {Number} The size of the package in bytes.
    - `gzip` {Number} The size of the package in bytes after gzip.

## Related Works

- vscode-import-cost: The VS Code extension that uses this package. // TODO

## License

MIT @ [hyrious](https://github.com/hyrious)
