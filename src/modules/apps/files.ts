import * as fs from 'fs';
import { AppCreate } from './app';

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

export function readFile(): AppCreate {
  let data: string;
  try {
    if (!fs.existsSync(appFile)) {
      throw new Error(appFile + ' not found, please init app first.');
    }
    data = fs.readFileSync(appFile, 'utf-8');
  } catch (e) {
    throw e;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    throw new Error('Failed to parse json');
  }
}

export function writeFile(content: AppCreate) {
  try {
    return fs.writeFileSync(appFile, JSON.stringify(content, null, 2), 'utf-8');
  } catch (e) {
    throw e;
  }
}
