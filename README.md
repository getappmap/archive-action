# getappmap/archive-appmap

> To get started with AppMap in GitHub actions, you need to start by installing the [AppMap App on the official GitHub Marketplace](https://github.com/marketplace/get-appmap)
> 
> To see a step-by-step example of how to install this action into your software project, [review the official AppMap Documentation](http://appmap.io/docs/analysis/in-github-actions).

GitHub Action used during initial setup to create a Configuration report. Also used in matrix builds to create an archive of AppMaps on a worker node and save them to the GitHub cache. Finally, used when a PR is merged (both in matrix and non-matrix mode) to build and store a baseline artifact. This is also done on a schedule (cron) to ensure that the artifacts don't expire and disappear. Default GitHub artifact expiration is 90 days. This is a configurable GitHub org or project setting.

## Table of contents

- [Requirements](#Requirements)
- [Inputs](#inputs)
- [Examples](#examples)
- [Development](#development)

## Requirements

The `archive-action` needs to run AFTER your test cases have executed to build and save an AppMap archive to the GitHub build asset repository. Your application will need AppMap libraries and configuration files created in the project, or you will need to use the [`install-action`](https://github.com/getappmap/install-action) to setup AppMap before your test cases run. 

For more information about how to setup AppMap in your project [review the official AppMap Documentation](http://appmap.io/docs/analysis/in-github-actions).

## Inputs

Add a step like this to your workflow:

```yaml
- name: Archive AppMaps
  uses: getappmap/archive-action@v1
  with:
    # Command working directory. Use this option this to install AppMap to a 
    # subdirectory of a monorepo / multi-folder project. When this input is specified,
    # AppMaps that project will be written to the directory `$directory/tmp/appmap`.
    # Be aware of this in any subsequent steps.
    # Default: '.'
    directory: ./projects/backend

    # 0-based numerical id of a matrix job. This id is used to store the AppMap 
    # archive in the action cache. Once the matrix jobs complete, the `merge` 
    # action can be used to merge the archives into a single archive, and then 
    # save it as an artifact. If `archive-id` is set, the archive is saved to the 
    # cache. Otherwise, it's uploaded to the artifact store. For a non-matrix 
    # job, `archive-id` should not be used.
    # Required for Multi-runner matrix builds.
    archive-id: ${{ matrix.ci_node_index }}

    # Revision (commit SHA) to name the AppMap archive with. The default is the 
    # GITHUB_SHA. Under normal circumstances, the default value is correct 
    # and this input does not need to be specified.
    revision: 6056b0cfbacd562f4a4f274122c4a5e85542e040
      
    # The GitHub token to used to interact with GitHub Caches, Pull Requests, etc.
    # Default: `${{ github.token }}`
    github-token: secrets.CUSTOM_GITHUB_TOKEN
    
    # Number of worker threads to use for processing the archive. Defaults to the 
    # number of CPUs / cores, as reported by Node.js. If the worker machine has 
    # a high number of CPUs/cores, the archive action may become I/O-bound rather 
    # than CPU-bound, and better performance might be obtained by setting this 
    # value to a lower number.
    # Default: One worker thread for each core.
    thread-count: 4
        
    # Enable verbose logging of CLI subcommands. You can use the standard GitHub
    # Action log level option to control verbosity of this Action itself.
    # Default: false
    verbose: true
```

## Examples

This example will run on any branch build that is not a Pull Request. 
```yaml
- name: Archive AppMaps
  if: github.event_name != 'pull_request'
  uses: getappmap/archive-action@v1
  with:
    directory: tmp/appmap
```

Use the `revision` option to set the SHA that will be used for building the archive.  **For example, this is used during installation to set a specific base SHA. **

```yaml
- name: Archive AppMaps
  uses: getappmap/archive-action@v1
  with:
    revision: ${{ github.event.pull_request.base.sha }}
```

Use the `archive-id` when building a multi-runner matrix build. Set the `archive-id` equal to the unique index ID of the runner which executed the build.  For example, if you have split your runners with the following strategy.

```yaml
strategy:
  fail-fast: false
  matrix:
    ci_node_total: [2]
    ci_node_index: [0, 1]
```

You can us the `matrix.ci_node_index` variable to set either `0` or `1` as the unique node index ID for the `archive-id`.  Additionally, you will use the `archive-action/merge` action to merge AppMaps before archiving them.

**NOTE:** The `if: always()` is used to ensure that the AppMap Archive is generated even if there are failed test cases. The failed test cases will be included in the AppMap analysis report.

```yaml
- name: Merge AppMaps
  uses: getappmap/archive-action/merge@v1
  with:
    revision: ${{ github.event.pull_request.head.sha }}
    archive-count: 2 # Set this equal to the TOTAL number of runners in your workflow
- name: Archive AppMaps
  if: always()
  uses: getappmap/archive-action@v1
  with:
    archive-id: ${{ matrix.ci_node_index }} # Set this equal to the unique index of the runner
```

For more examples, refer to the [AppMap example projects](https://appmap.io/docs/setup-appmap-in-ci/example-projects.html)

## Development

```
# Remove build artifacts
$ yarn clean

# Build the project
$ yarn build

# Run tests
$ yarn test

# Package the project into a distributable GitHub action
$ yarn package
```
