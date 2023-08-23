# getappmap/archive-appmap

GitHub action to build and store an AppMap archive.

To see a step-by-step example of how to install this action into your software project, [review the official AppMap Documentation](http://appmap.io/docs/analysis/in-github-actions).

In non-matrix builds, this action should be run
run when code is merged to the main branch. The archive is saved to the GitHub artifact store.
In matrix builds, this action should be run for each matrix job. The archive is saved to 
the action cached, and then in a subsequent job, the archives are merged into a single archive
using the `merge` action.
  
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
