import * as fs from 'fs';
import { SupportedExtension } from './fs';
import YAML = require('js-yaml');

interface OwnerReference {
  apiVersion: string;
  kind: string;
  name: string;
}

export interface K8sObject {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    [key: string]: any;
    labels?: Record<string, string> | null;
    annotations?: Record<string, string> | null;
  };
  ownerReferences?: null | Array<OwnerReference>;
  [key: string]: any;
}

/** Bare minimum validation for k8s objects (checks for apiVersion and kind) */
export function isValidK8sObject(obj: any): obj is K8sObject {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    obj.hasOwnProperty('apiVersion') &&
    obj.hasOwnProperty('kind') &&
    obj.hasOwnProperty('metadata')
  );
}

export async function parseK8sManifestsFromFile(
  filepath: string,
  extension: SupportedExtension
): Promise<K8sObject[]> {
  const rawData = await fs.promises.readFile(filepath, { encoding: 'utf8' });

  const isYAML = ['yaml', 'yml'].includes(extension);
  let parsed: Record<string, any>[] = isYAML
    ? YAML.safeLoadAll(rawData)
    : JSON.parse(rawData);

  if (!Array.isArray(parsed)) {
    parsed = [parsed];
  }

  parsed = parsed.filter((o) => !!o);

  for (let i = 0; i < parsed.length; i++) {
    if (isValidK8sObject(parsed[i]) === false) {
      throw new Error(
        `Invalid Kubernetes resource: ${JSON.stringify(parsed[i])}`
      );
    }
  }

  return parsed as K8sObject[];
}
