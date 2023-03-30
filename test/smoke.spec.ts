import {join} from 'path';

const pwd = process.cwd();

describe('archihve-appmap-action', () => {
  beforeEach(() => process.chdir(join(__dirname, 'fixture')));
  afterEach(() => process.chdir(pwd));

  it('build and store an AppMap archive', async () => {});
});
