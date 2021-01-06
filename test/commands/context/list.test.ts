import { expect, test } from '@oclif/test';

describe('context:list', () => {
  test
    .stdout()
    .command(['context:list'])
    .it('displays a list of contexts', (ctx) => {
      expect(ctx.stdout).to.contain('default');
    });
});
