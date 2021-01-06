import * as fs from 'fs';
import * as path from 'path';
import nodeFetch from 'node-fetch';
import { homedir } from 'os';
// @ts-ignore
import { createHarLog, withHar } from 'node-fetch-har';

const homeDir = homedir();
const LOG_REQUESTS = false;

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
    const filePath = path.join(homeDir, 'logs', fileName);
    fs.writeFileSync(filePath, JSON.stringify(createHarLog(har), null, 2));
  }
  return { fetch, writeHAR };
})();
