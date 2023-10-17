import * as core from '@actions/core';
import * as log from '@appland/action-utils';
import {Archive, runInGitHub} from '../src/archive';

describe('archive.runInGitHub', () => {
  let inputs: Record<string, string> = {};
  let action: Archive;
  let warnSpy: jest.SpyInstance;
  let getInputSpy: jest.SpyInstance;
  let warnings: string[];

  beforeEach(() => (warnings = []));
  beforeEach(() => (action = new Archive()));
  beforeEach(
    () =>
      (getInputSpy = jest
        .spyOn(core, 'getInput')
        .mockImplementation((name: string) => inputs[name]))
  );
  beforeEach(
    () =>
      (warnSpy = jest
        .spyOn(log, 'log')
        .mockImplementation((level: log.LogLevel, message: string) => {
          if (level === log.LogLevel.Warn) warnings.push(message);
          else console[level](message);
        }))
  );
  beforeEach(() => jest.spyOn(action, 'archive').mockResolvedValue({} as any));

  afterEach(() => jest.restoreAllMocks());

  it('warns if archive-id and revision are both set', async () => {
    inputs = {
      'archive-id': '123',
      revision: 'abc',
    };

    runInGitHub(action);

    expect(warnings).toEqual([`Ignoring revision option 'abc' because archive-id is set`]);
  });

  it('does not warn if archive-id is set and revision is not set', async () => {
    inputs = {
      'archive-id': '123',
    };

    runInGitHub(action);

    expect(warnings).toEqual([]);
  });
});
