import * as fs from 'fs';

export function createFolder(name: string) {
  try {
    if (fs.existsSync(name)) return;
    fs.mkdirSync(name);
  } catch (e) {
    throw e;
  }
}

export function readFile(name: string) {
  let data: string;
  try {
    if (!fs.existsSync(name)) {
      throw new Error(name + ' not found, please init app first.');
    }
    data = fs.readFileSync(name, 'utf-8');
  } catch (e) {
    throw e;
  }
  return JSON.parse(data);
}

export function writeFile(name: string, content: any) {
  try {
    return fs.writeFileSync(name, JSON.stringify(content, null, 2), 'utf-8');
  } catch (e) {
    throw e;
  }
}

export function getDefaultAppName(): string {
  return readFile('./.app.platformer/config.json').name;
}
