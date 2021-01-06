import * as fs from 'fs';
import * as path from 'path';
import { K8sObject } from './parser';

export type SupportedExtension = 'json' | 'yaml' | 'yml';
export interface FileInfo {
  filepath: string;
  fileName: string;
  extension: SupportedExtension;
}

function resolvePath(inputPath: string) {
  let fileFolderPath = path.resolve(inputPath);
  if (!path.isAbsolute(fileFolderPath)) {
    fileFolderPath = path.resolve('../', fileFolderPath);
  }
  return fileFolderPath;
}

export async function validateManifestPath(
  inputPath: string
): Promise<{ files: FileInfo[]; isDir: boolean }> {
  let fileFolderPath = resolvePath(inputPath);
  let stat;
  try {
    stat = fs.statSync(fileFolderPath);
  } catch (err) {
    throw new Error(`${fileFolderPath} is not a path`);
  }
  if (stat.isFile()) {
    const file = getFileInfo(fileFolderPath, true)!;
    return { files: [file], isDir: false };
  } else if (stat.isDirectory()) {
    const content = await fs.promises.readdir(fileFolderPath, {
      withFileTypes: true,
    });
    const files = content
      .map((entry) => {
        if (entry.isFile()) {
          return getFileInfo(path.join(fileFolderPath, entry.name), false)!;
        }
        if (entry.isDirectory()) {
          //ignore directories
          return null;
        }
      })
      .filter((f): f is FileInfo => Boolean(f))
      .sort((f1, f2) => f1.fileName.localeCompare(f2.fileName));
    if (files.length === 0) {
      throw new Error(`${fileFolderPath} doesn't contain any valid files`);
    }
    return { files, isDir: true };
  } else {
    throw new Error(`${fileFolderPath} is not a path`);
  }
}

function getFileInfo(filePath: string, throwError: boolean): FileInfo | null {
  const ext = path.extname(filePath).substr(1).toLowerCase();
  const fileName = path.basename(filePath);
  if (!['json', 'yaml', 'yml'].includes(ext)) {
    if (!throwError) return null;
    throw new Error(
      `Unsupported file extension "${ext}". Must be of type: json/yaml/yml`
    );
  }
  return { filepath: filePath, fileName, extension: ext as SupportedExtension };
}

export async function createOutputPath(envId: string) {
  const outputPath = `platformer/${envId}`;
  try {
    return await fs.promises.mkdir(outputPath, { recursive: true });
  } catch (error) {}
}

export async function writeManifestResult(
  data: Record<string, any>,
  manifest: K8sObject,
  envId: string
) {
  const filePath = `platformer/${envId}/${manifest.kind}-${manifest.metadata.name}`;
  const str = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(resolvePath(filePath), str);
}
