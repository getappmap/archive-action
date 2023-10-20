# getappmap/archive-appmap <!-- omit in toc -->

> To get started with AppMap in GitHub actions, you need to start by installing the [AppMap App on the official GitHub Marketplace](https://github.com/marketplace/get-appmap)

> To see a step-by-step example of how to install this action into your software project, [review the official AppMap Documentation](http://appmap.io/docs/analysis/in-github-actions).

GitHub action to build and store an AppMap archive.

## Table of contents <!-- omit in toc -->

- [Prerequisites](#prerequisites)
- [Inputs](#inputs)
- [Examples](#examples)
- [Development](#development)

## Prerequisites

The `archive-action` needs to run AFTER your test cases have executed to build and save an AppMap archive to the GitHub build asset repository. Your application will need AppMap libraries and configuration files created in the project, or you will need to use the [`install-action`](https://github.com/getappmap/install-action) to setup AppMap before your test cases run. 

For more information about how to setup AppMap in your project [review the official AppMap Documentation](http://appmap.io/docs/analysis/in-github-actions).

## Inputs

Add a step like this to your workflow:

```yaml
- name: Archive AppMaps
  uses: getappmap/archive-action@v1
  with:
    # Command working directory. Change this if your project lives in a 
    # subdirectory or for monorepo / multi-project support
    # Default: '.'
    directory: /path/to/code

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
      
    # The GitHub token to use with the GitHub API to enumerate AppMap Tools 
    # releases.
    # Default: `${{ github.token }}`
    github-token: secrets.CUSTOM_GITHUB_TOKEN
    
    # Number of worker threads to use for processing the archive. Defaults to the 
    # number of CPUs / cores, as reported by Node.js. If the worker machine has 
    # a high number of CPUs/cores, the archive action may become I/O-bound rather 
    # than CPU-bound, and better performance might be obtained by setting this 
    # value to a lower number.
    thread-count: 4
        
    # Enable verbose logging.
    # Default: false
    verbose: true
```

## Examples

Use the `revision` option to set the SHA that will be used for building the archive.  For example, this is used during installation to set a specific base SHA. 

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

You can us the `matrix.ci_node_index` variable to set either `0` or `1` as the unique node index ID for the `archive-id`

```yaml
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
