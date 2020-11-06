import * as fs from 'fs';
import * as path from 'path';

export type SupportedExtension = 'json' | 'yaml' | 'yml';

export function validateManifestFile(
  filepath: string
): {
  filepath: string;
  extension: SupportedExtension;
} {
  filepath = path.resolve(filepath);
  if (!path.isAbsolute(filepath)) {
    filepath = path.resolve('../', filepath);
  }

  try {
    fs.statSync(filepath).isFile();
  } catch (err) {
    throw new Error(`${filepath} is not a file`);
  }

  const ext = path.extname(filepath).substr(1).toLowerCase();
  if (!['json', 'yaml', 'yml'].includes(ext)) {
    throw new Error(
      `Unsupported file extension "${ext}". Must be of type: json/yaml/yml`
    );
  }

  return { filepath, extension: ext as SupportedExtension };
}
