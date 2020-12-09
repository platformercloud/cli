import * as fs from 'fs';
import nodeFetch from 'node-fetch';
import { withHar, createHarLog } from 'node-fetch-har';
import * as path from 'path';

const har: any[] = [];

export const fetch = withHar(nodeFetch, {
  onHarEntry: (entry: any) => har.push(entry),
}) as typeof nodeFetch;

export function writeHAR(
  dir = `/home/kcd/logs/`,
  fileName = `har-${new Date().toISOString()}.har`
) {
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(createHarLog(har), null, 2));
}
