import { expect, test } from '@oclif/test';

describe('command: context', () => {
  test
    .stdout()
    .command(['context:list'])
    .it('displays a list of contexts', (ctx) => {
      expect(ctx.stdout).to.not.be.empty;
    });
});
