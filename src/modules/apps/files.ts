import * as fs from 'fs';

const appFolder = './.app.platformer';
const appFile = './.app.platformer/config.json';

export function createFolder() {
  try {
    if (fs.existsSync(appFolder)) return;
    fs.mkdirSync(appFolder);
  } catch (e) {
    throw e;
  }
}

export function readFile() {
  let data: string;
  let json: any;
  try {
    if (!fs.existsSync(appFile)) {
      throw new Error(appFile + ' not found, please init app first.');
    }
    data = fs.readFileSync(appFile, 'utf-8');
  } catch (e) {
    throw e;
  }
  try {
    json = JSON.parse(data);
  } catch (e) {
    throw new Error('Failed to parse json');
  }
  return json;
}

export function writeFile(content: any) {
  try {
    return fs.writeFileSync(appFile, JSON.stringify(content, null, 2), 'utf-8');
  } catch (e) {
    throw e;
  }
}

export function getDefaultAppName(): string {
  return readFile().name;
}

export function getDefaultOrganizationIdFile(): string {
  return readFile().orgId;
}

export function getDefaultProjectIdFile(): string {
  return readFile().projectId;
}
