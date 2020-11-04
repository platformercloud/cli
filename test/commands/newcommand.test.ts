import {expect, test} from '@oclif/test'

describe('newcommand', () => {
  test
  .stdout()
  .command(['newcommand'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['newcommand', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
