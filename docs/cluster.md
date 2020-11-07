`platformer cluster`
====================

Connect a Kubernetes Cluster (in your kubeconfig) to the Platformer Console

* [`platformer cluster:connect [CLUSTER]`](#platformer-clusterconnect-cluster)
* [`platformer cluster:list`](#platformer-clusterlist)

## `platformer cluster:connect [CLUSTER]`

Connect a Kubernetes Cluster (in your kubeconfig) to the Platformer Console

```
USAGE
  $ platformer cluster:connect [CLUSTER]

ARGUMENTS
  CLUSTER  (OPTIONAL) Name of the Kubernetes Cluster to connect to the Platformer Console (must be a cluster name in
           your kubeconfig). If not provided, the CLI will enter an interactive mode to select a Cluster.

OPTIONS
  -O, --organization=organization  Organization Name
  -P, --project=project            Project Name
  -h, --help                       show CLI help

EXAMPLES
  $ platformer connect:cluster
  $ platformer connect:cluster <cluster-name as listed in your kubeconfig>
  $ platformer connect:cluster --organization <organization> --project <project> # override context defaults
```

_See code: [src/commands/cluster/connect.ts](https://github.com/platformercloud/cli/blob/v0.0.3/src/commands/cluster/connect.ts)_

## `platformer cluster:list`

Lists all connected Kubernetes Clusters in a Project

```
USAGE
  $ platformer cluster:list

OPTIONS
  -O, --organization=organization  Organization Name
  -P, --project=project            Project Name
  -h, --help                       show CLI help
  -x, --extended                   show extra columns
  --columns=columns                only show provided columns (comma-seperated)
  --csv                            output is csv format
  --filter=filter                  filter property by partial string matching, ex: name=default
  --no-header                      hide table header from output
  --no-truncate                    do not truncate output to fit screen
```

_See code: [src/commands/cluster/list.ts](https://github.com/platformercloud/cli/blob/v0.0.3/src/commands/cluster/list.ts)_
