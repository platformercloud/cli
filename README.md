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
$ pctl COMMAND
running command...
$ pctl (-v|--version|version)
pctl/0.0.0 win32-x64 node-v14.8.0
$ pctl --help [COMMAND]
USAGE
  $ pctl COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`pctl hello [FILE]`](#pctl-hello-file)
* [`pctl help [COMMAND]`](#pctl-help-command)
* [`pctl login [FILE]`](#pctl-login-file)
* [`pctl newcommand [FILE]`](#pctl-newcommand-file)

## `pctl hello [FILE]`

describe the command here

```
USAGE
  $ pctl hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ pctl hello
  hello world from ./src/hello.ts!
```

_See code: [src\commands\hello.ts](https://github.com/platformercloud/pctl/blob/v0.0.0/src\commands\hello.ts)_

## `pctl help [COMMAND]`

display help for pctl

```
USAGE
  $ pctl help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src\commands\help.ts)_

## `pctl login [FILE]`

describe the command here

```
USAGE
  $ pctl login [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src\commands\login.ts](https://github.com/platformercloud/pctl/blob/v0.0.0/src\commands\login.ts)_

## `pctl newcommand [FILE]`

describe the command here

```
USAGE
  $ pctl newcommand [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src\commands\newcommand.ts](https://github.com/platformercloud/pctl/blob/v0.0.0/src\commands\newcommand.ts)_
<!-- commandsstop -->
