import verbose from './verbose';

export function setVerbose(isVerbose: string | boolean) {
  verbose(isVerbose === 'true' || isVerbose === true);
}
