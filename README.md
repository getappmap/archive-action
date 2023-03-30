# getappmap/archive-appmap

GitHub action to build and store an AppMap archive.

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

## TODO

- [ ] Add description to action.yml.
- [ ] Store AppMap archive contents as an artifact.
- [ ] Optionally remove the AppMap data from the archive, and point to the artifact instead.
- [x] Consume AppMap tools path from getappmap/install-appmap-action.
