import * as fs from 'fs';
import * as path from 'path';
import nodeFetch from 'node-fetch';
import { homedir } from 'os';
// @ts-ignore
import { createHarLog, withHar } from 'node-fetch-har';
import { cli } from 'cli-ux';

const homeDir = homedir();
const LOG_REQUESTS =
  process.env.DEBUG === '*' || process.env.DEBUG === 'REQUESTS';

export const { fetch, writeHAR } = (function () {
  if (!LOG_REQUESTS)
    return {
      fetch: nodeFetch,
      writeHAR() {
        /**ignore request logs */
      },
    };
  const har: any[] = [];
  const fetch = withHar(nodeFetch, {
    onHarEntry: (entry: any) => har.push(entry),
  });
  function writeHAR(fileName = `har-${new Date().toISOString()}.har`) {
    writeToHAR(fileName, har);
  }
  return { fetch, writeHAR };
})();

function writeToHAR(fileName: string, logs: any[]) {
  const folderPath = path.join(homeDir, 'platformer-logs');
  const filePath = path.join(folderPath, fileName);
  try {
    fs.mkdirSync(folderPath, { recursive: true });
  } catch (error) {}
  try {
    fs.writeFileSync(filePath, JSON.stringify(createHarLog(logs), null, 2));
  } catch (error) {
    cli.error(`Failed to write to ${filePath}`);
  }
}
