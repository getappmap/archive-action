import {cp, mkdir, rm, writeFile} from 'fs/promises';
import locateArchiveFile from '../src/locateArchiveFile';
import * as test from './helper';
import {join} from 'path';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('locateArchiveFile', () => {
  let workDir: string;

  beforeEach(() => (workDir = test.makeWorkDir()));
  beforeEach(() => cp(test.fixtureDir, workDir, {recursive: true, force: true}));
  afterEach(() => rm(workDir, {recursive: true, force: true}));

  it(`errors if there's no archive`, async () => {
    expect(locateArchiveFile(workDir)).rejects.toThrow(/No AppMap archives found/);
  });
  it(`chooses the most recent`, async () => {
    await mkdir(join(workDir, '.appmap/archive/full'), {recursive: true});
    await writeFile(join(workDir, '.appmap/archive/full/1.tar'), '');
    wait(1);
    await writeFile(join(workDir, '.appmap/archive/full/2.tar'), '');
    wait(1);
    await writeFile(join(workDir, '.appmap/archive/full/3.tar'), '');
    wait(1);

    expect(locateArchiveFile(workDir)).resolves.toMatch(/\.appmap\/archive\/full\/3\.tar$/);
  });
});
