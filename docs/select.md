`platformer select`
===================

Select a context

* [`platformer select:context [NAME]`](#platformer-selectcontext-name)
* [`platformer select:environment [ENVIRONMENT]`](#platformer-selectenvironment-environment)
* [`platformer select:organization [ORGANIZATION]`](#platformer-selectorganization-organization)
* [`platformer select:project [PROJECT]`](#platformer-selectproject-project)

## `platformer select:context [NAME]`

Select a context

```
USAGE
  $ platformer select:context [NAME]

ARGUMENTS
  NAME  (OPTIONAL) Context name. If not provided, the CLI will prompt an interactive selection

OPTIONS
  -h, --help  show CLI help
```

_See code: [src/commands/select/ctx.ts](https://github.com/platformercloud/cli/blob/v0.0.3/src/commands/select/context.ts)_

## `platformer select:environment [ENVIRONMENT]`

Select a default Environment for your current context.

```
USAGE
  $ platformer select:environment [ENVIRONMENT]

ARGUMENTS
  ENVIRONMENT  (OPTIONAL) Name of the Environment to set in the current context. If not provided, the CLI will open an
               interactive prompt to select an Environment.

OPTIONS
  -O, --organization=organization  Organization Name
  -P, --project=project            Project Name
  -h, --help                       show CLI help

ALIASES
  $ platformer select:environment
  $ platformer select:env

EXAMPLES
  $ platformer select:environment # interactive select
  $ platformer select:env <environment-name>
```

_See code: [src/commands/select/env.ts](https://github.com/platformercloud/cli/blob/v0.0.3/src/commands/select/environment.ts)_

## `platformer select:organization [ORGANIZATION]`

Select a default Organization for your current context.

```
USAGE
  $ platformer select:organization [ORGANIZATION]

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

_See code: [src/commands/select/org.ts](https://github.com/platformercloud/cli/blob/v0.0.3/src/commands/select/organization.ts)_

## `platformer select:project [PROJECT]`

Select a default Project for your current context. Requires an Organization to be set with select:org or using the --o flag

```
USAGE
  $ platformer select:project [PROJECT]

ARGUMENTS
  PROJECT  (OPTIONAL) Name of the Project to set in the current context. If not provided, the CLI will open an
           interactive prompt to select an Project.

OPTIONS
  -O, --organization=organization  organization name
  -h, --help                       show CLI help

ALIASES
  $ platformer select:project
  $ platformer select:proj

EXAMPLES
  $ platformer select:project # interactive select
  $ platformer select:project <project-name>
```

_See code: [src/commands/select/proj.ts](https://github.com/platformercloud/cli/blob/v0.0.3/src/commands/select/project.ts)_
