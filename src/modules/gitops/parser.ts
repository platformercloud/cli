import { SupportedExtension } from './fs';
import * as fs from 'fs';
import YAML = require('js-yaml');

export interface K8sObject {
  apiVersion: string;
  kind: string;
  [key: string]: any;
}

/** Bare minimum validation for k8s objects (checks for apiVersion and kind) */
export function isValidK8sObject(obj: Object) {
  return obj.hasOwnProperty('apiVersion') && obj.hasOwnProperty('kind');
}

export async function parseK8sManifestsFromFile(
  filepath: string,
  extension: SupportedExtension
): Promise<K8sObject[]> {
  const rawData = await fs.promises.readFile(filepath, { encoding: 'utf8' });

  const isYAML = ['yaml', 'yml'].includes(extension);
  let parsed: Object[] = isYAML
    ? YAML.safeLoadAll(rawData)
    : JSON.parse(rawData);

  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  for (let i = 0; i < parsed.length; i++) {
    if (isValidK8sObject(parsed[i]) === false) {
      throw new Error(
        `Invalid Kubernetes resource: ${JSON.stringify(parsed[i])}`
      );
    }
  }

  return parsed as K8sObject[];
}
