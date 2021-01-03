import * as fs from 'fs';
import nodeFetch from 'node-fetch';
import { createHarLog, withHar } from 'node-fetch-har';
import * as path from 'path';
import { homedir } from 'os';
const homeDir = homedir();

const har: any[] = [];

export const fetch = withHar(nodeFetch, {
  onHarEntry: (entry: any) => har.push(entry),
}) as typeof nodeFetch;

export function writeHAR(fileName = `har-${new Date().toISOString()}.har`) {
  const filePath = path.join(homeDir, 'logs', fileName);
  fs.writeFileSync(filePath, JSON.stringify(createHarLog(har), null, 2));
}
