import * as fs from 'fs';
import * as path from 'path';

export type SupportedExtension = 'json' | 'yaml' | 'yml';
export interface FileInfo {
  filepath: string;
  extension: SupportedExtension;
}

export async function validateManifestPath(
  inputPath: string
): Promise<{ files: FileInfo[]; isDir: boolean }> {
  let fileFolderPath = path.resolve(inputPath);
  if (!path.isAbsolute(fileFolderPath)) {
    fileFolderPath = path.resolve('../', fileFolderPath);
  }
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
      .filter(Boolean) as FileInfo[];
    if (files.length === 0) {
      console.log(
        files,
        content.map((c) => c.name)
      );
      throw new Error(`${fileFolderPath} doesn't contain any valid files`);
    }
    return { files, isDir: true };
  } else {
    throw new Error(`${fileFolderPath} is not a path`);
  }
}

function getFileInfo(
  filePathPath: string,
  throwError: boolean
): FileInfo | null {
  const ext = path.extname(filePathPath).substr(1).toLowerCase();
  if (!['json', 'yaml', 'yml'].includes(ext)) {
    if (!throwError) return null;
    throw new Error(
      `Unsupported file extension "${ext}". Must be of type: json/yaml/yml`
    );
  }
  return { filepath: filePathPath, extension: ext as SupportedExtension };
}
