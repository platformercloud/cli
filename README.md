pctl
====

Command Line Interface for the Platformer Console

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/pctl.svg)](https://npmjs.org/package/pctl)
[![Downloads/week](https://img.shields.io/npm/dw/pctl.svg)](https://npmjs.org/package/pctl)
[![License](https://img.shields.io/npm/l/pctl.svg)](https://github.com/platformercloud/pctl/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g pctl
$ platformer COMMAND
running command...
$ platformer (-v|--version|version)
pctl/0.0.0 win32-x64 node-v14.8.0
$ platformer --help [COMMAND]
USAGE
  $ platformer COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`platformer connect [FILE]`](#platformer-connect-file)
* [`platformer help [COMMAND]`](#platformer-help-command)
* [`platformer login`](#platformer-login)
* [`platformer newcommand [FILE]`](#platformer-newcommand-file)
* [`platformer select:org [FILE]`](#platformer-selectorg-file)

## `platformer connect [FILE]`

describe the command here

```
USAGE
  $ platformer connect [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src\commands\connect.ts](https://github.com/platformercloud/cli/blob/v0.0.0/src\commands\connect.ts)_

## `platformer help [COMMAND]`

display help for platformer

```
USAGE
  $ platformer help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src\commands\help.ts)_

## `platformer login`

Log in to the CLI with your Platformer Account

```
USAGE
  $ platformer login
```

_See code: [src\commands\login.ts](https://github.com/platformercloud/cli/blob/v0.0.0/src\commands\login.ts)_

## `platformer newcommand [FILE]`

describe the command here

```
USAGE
  $ platformer newcommand [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src\commands\newcommand.ts](https://github.com/platformercloud/cli/blob/v0.0.0/src\commands\newcommand.ts)_

## `platformer select:org [FILE]`

select org

```
USAGE
  $ platformer select:org [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ pctl org
  org world from ./src/hello.ts!
```

_See code: [src\commands\select\org.ts](https://github.com/platformercloud/cli/blob/v0.0.0/src\commands\select\org.ts)_
<!-- commandsstop -->
