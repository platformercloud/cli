`platformer context`
====================

Add a new context

* [`platformer context:add NAME`](#platformer-contextadd-name)
* [`platformer context:list`](#platformer-contextlist)
* [`platformer context:remove NAME`](#platformer-contextremove-name)

## `platformer context:add NAME`

Add a new context

```
USAGE
  $ platformer context:add NAME

ARGUMENTS
  NAME  Context name (must be unique)

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/context/add.ts](https://github.com/platformercloud/cli/blob/v0.0.3/src/commands/context/add.ts)_

## `platformer context:list`

Lists all configured contexts

```
USAGE
  $ platformer context:list

OPTIONS
  -h, --help         show CLI help
  -x, --extended     show extra columns
  --columns=columns  only show provided columns (comma-seperated)
  --csv              output is csv format
  --filter=filter    filter property by partial string matching, ex: name=default
  --no-header        hide table header from output
  --no-truncate      do not truncate output to fit screen
```

_See code: [src/commands/context/list.ts](https://github.com/platformercloud/cli/blob/v0.0.3/src/commands/context/list.ts)_

## `platformer context:remove NAME`

Remove a context

```
USAGE
  $ platformer context:remove NAME

ARGUMENTS
  NAME  Context name to remove

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/context/remove.ts](https://github.com/platformercloud/cli/blob/v0.0.3/src/commands/context/remove.ts)_
