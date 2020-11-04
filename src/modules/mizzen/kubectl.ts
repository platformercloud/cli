import { promisify } from 'util';
import { lookpath } from 'lookpath';
const exec = promisify(require('child_process').exec);

export async function kubectlIsInstalled() {
  return await lookpath('kubectl');
}

export async function listClustersInKubeconfig(): Promise<string[]> {
  const { stdout } = await exec('kubectl config get-clusters');
  if (!stdout) {
    return [];
  }
  return (stdout as string)
    .split('\n')
    .filter((s) => Boolean(s) && s !== 'NAME');
}
