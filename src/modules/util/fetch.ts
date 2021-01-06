import * as fs from 'fs';
import nodeFetch from 'node-fetch';
import { createHarLog, withHar } from 'node-fetch-har';
import { homedir } from 'os';
import * as path from 'path';
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
