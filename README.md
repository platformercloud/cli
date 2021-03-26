# Platformer CLI

Command Line Interface for the [Platformer Console](https://beta.platformer.com)

[![Version](https://img.shields.io/npm/v/platformer-cli.svg)](https://npmjs.org/package/platformer-cli)

<!-- [![Downloads/week](https://img.shields.io/npm/dw/platformer-cli.svg)](https://npmjs.org/package/platformer-cli) -->
<!-- [![License](https://img.shields.io/npm/l/platformer-cli.svg)](https://github.com/platformercloud/platformer-cli/blob/master/package.json) -->

# Installation

The Platformer CLI can be installed via NPM (Node Package Manager) or through a standalone binary.

## Installation with NPM

- Requires [Node v14+ and NPM](https://nodejs.org/en/download/). (Installing Node will install NPM as well)

- Run `npm install -g platformer-cli`

- The Platformer CLI can now be accessed with the `platformer` command.

## Installation via a Standalone binary

- Check the [Releases section](https://github.com/platformercloud/cli/releases) and download the relavent binary based on your Operating System.

- Once installed, the Platformer CLI will be accessible with the `platformer` command.

---

<!-- toc -->
* [Platformer CLI](#platformer-cli)
* [Installation](#installation)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

---

# Usage

<!-- usage -->
```sh-session
$ npm install -g platformer-cli
$ platformer COMMAND
running command...
$ platformer (-v|--version|version)
platformer-cli/0.1.10 linux-x64 node-v14.15.1
$ platformer --help [COMMAND]
USAGE
  $ platformer COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`platformer apply FILEPATH`](#platformer-apply-filepath)
* [`platformer cluster:connect [CLUSTER]`](#platformer-clusterconnect-cluster)
* [`platformer cluster:list`](#platformer-clusterlist)
* [`platformer context:add NAME`](#platformer-contextadd-name)
* [`platformer context:list`](#platformer-contextlist)
* [`platformer context:remove NAME`](#platformer-contextremove-name)
* [`platformer help [COMMAND]`](#platformer-help-command)
* [`platformer import`](#platformer-import)
* [`platformer login`](#platformer-login)
* [`platformer logout`](#platformer-logout)
* [`platformer select:cxt [NAME]`](#platformer-selectcxt-name)
* [`platformer select:env [ENVIRONMENT]`](#platformer-selectenv-environment)
* [`platformer select:org [ORGANIZATION]`](#platformer-selectorg-organization)
* [`platformer select:proj [PROJECT]`](#platformer-selectproj-project)

## `platformer apply FILEPATH`

Create resources in Platformer Console using a Kubernetes YAMLs

```
USAGE
  $ platformer apply FILEPATH

ARGUMENTS
  FILEPATH  Path to YAML file

OPTIONS
  -A, --all                        Log out of all contexts
  -E, --environment=environment    [default: do-development] Environment Name
  -O, --organization=organization  [default: Platformer Developer Portal] Organization Name
  -P, --project=project            [default: Temp Production] Project Name
  -T, --target-ns=target-ns        Target namespace
  -h, --help                       show CLI help
  --save
```

_See code: [src/commands/apply.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/apply.ts)_

## `platformer cluster:connect [CLUSTER]`

Connect a Kubernetes Cluster (in your kubeconfig) to the Platformer Console

```
USAGE
  $ platformer cluster:connect [CLUSTER]

ARGUMENTS
  CLUSTER  (OPTIONAL) Name of the Kubernetes Cluster to connect to the Platformer Console (must be a cluster name in
           your kubeconfig). If not provided, the CLI will enter an interactive mode to select a Cluster.

OPTIONS
  -O, --organization=organization  [default: Platformer Developer Portal] Organization Name
  -P, --project=project            [default: Temp Production] Project Name
  -h, --help                       show CLI help

EXAMPLES
  $ platformer connect:cluster
  $ platformer connect:cluster <cluster-name as listed in your kubeconfig>
  $ platformer connect:cluster --organization <organization> --project <project> # override context defaults
```

_See code: [src/commands/cluster/connect.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/cluster/connect.ts)_

## `platformer cluster:list`

Lists all connected Kubernetes Clusters in a Project

```
USAGE
  $ platformer cluster:list

OPTIONS
  -O, --organization=organization  [default: Platformer Developer Portal] Organization Name
  -P, --project=project            [default: Temp Production] Project Name
  -h, --help                       show CLI help
  -x, --extended                   show extra columns
  --columns=columns                only show provided columns (comma-seperated)
  --csv                            output is csv format
  --filter=filter                  filter property by partial string matching, ex: name=default
  --no-header                      hide table header from output
  --no-truncate                    do not truncate output to fit screen
```

_See code: [src/commands/cluster/list.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/cluster/list.ts)_

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

_See code: [src/commands/context/add.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/context/add.ts)_

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

_See code: [src/commands/context/list.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/context/list.ts)_

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

_See code: [src/commands/context/remove.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/context/remove.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src/commands/help.ts)_

## `platformer import`

Import resources from existing namespace in a Kubernetes Cluster

```
USAGE
  $ platformer import

OPTIONS
  -A, --all                        Log out of all contexts
  -C, --cluster=cluster            (required) Cluster Name
  -E, --environment=environment    [default: do-development] Environment Name
  -N, --namespace=namespace        (required) Namspace
  -O, --organization=organization  [default: Platformer Developer Portal] Organization Name
  -P, --project=project            [default: Temp Production] Project Name
  -T, --target-ns=target-ns        Target namespace
  -h, --help                       show CLI help
  --save
```

_See code: [src/commands/import.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/import.ts)_

## `platformer login`

Log in to the CLI with your Platformer Account (logs into the current context)

```
USAGE
  $ platformer login
```

_See code: [src/commands/login.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/login.ts)_

## `platformer logout`

Log out of the CLI (from the current context)

```
USAGE
  $ platformer logout

OPTIONS
  -A, --all                          Log out of all contexts
  -h, --help                         show CLI help

  --context=default|devx|devc|devx2  [default: devx2] Name of a specific context to log out from (defaults to current
                                     context)
```

_See code: [src/commands/logout.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/logout.ts)_

## `platformer select:cxt [NAME]`

Select a context

```
USAGE
  $ platformer select:cxt [NAME]

ARGUMENTS
  NAME  (OPTIONAL) Context name. If not provided, the CLI will prompt an interactive selection

OPTIONS
  -h, --help  show CLI help

ALIASES
  $ platformer select:context
  $ platformer select:ctx
```

_See code: [src/commands/select/cxt.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/select/cxt.ts)_

## `platformer select:env [ENVIRONMENT]`

Select a default Environment for your current context.

```
USAGE
  $ platformer select:env [ENVIRONMENT]

ARGUMENTS
  ENVIRONMENT  (OPTIONAL) Name of the Environment to set in the current context. If not provided, the CLI will open an
               interactive prompt to select an Environment.

OPTIONS
  -O, --organization=organization  [default: Platformer Developer Portal] Organization Name
  -P, --project=project            [default: Temp Production] Project Name
  -h, --help                       show CLI help

ALIASES
  $ platformer select:environment
  $ platformer select:env

EXAMPLES
  $ platformer select:environment # interactive select
  $ platformer select:env <environment-name>
```

_See code: [src/commands/select/env.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/select/env.ts)_

## `platformer select:org [ORGANIZATION]`

Select a default Organization for your current context.

```
USAGE
  $ platformer select:org [ORGANIZATION]

ARGUMENTS
  ORGANIZATION  (OPTIONAL) Name of the Organization to set in the current context. If not provided, the CLI will open an
                interactive prompt to select an Organization.

OPTIONS
  -h, --help  show CLI help

ALIASES
  $ platformer select:organization
  $ platformer select:org
  $ platformer select:organisation

EXAMPLES
  $ platformer select:org # interactive select
  $ platformer select:org <organization-name>
```

_See code: [src/commands/select/org.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/select/org.ts)_

## `platformer select:proj [PROJECT]`

Select a default Project for your current context. Requires an Organization to be set with select:org or using the --o flag

```
USAGE
  $ platformer select:proj [PROJECT]

ARGUMENTS
  PROJECT  (OPTIONAL) Name of the Project to set in the current context. If not provided, the CLI will open an
           interactive prompt to select an Project.

OPTIONS
  -O, --organization=organization  [default: Platformer Developer Portal] organization name
  -h, --help                       show CLI help

ALIASES
  $ platformer select:project
  $ platformer select:proj

EXAMPLES
  $ platformer select:project # interactive select
  $ platformer select:project <project-name>
```

_See code: [src/commands/select/proj.ts](https://github.com/platformercloud/cli/blob/v0.1.10/src/commands/select/proj.ts)_
<!-- commandsstop -->
