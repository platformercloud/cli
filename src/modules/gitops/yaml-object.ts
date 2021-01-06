export interface YamlObject {
  ID: string;
  Name: string;
  Kind: string;
  Label: string;
}

export class MatchedMultipleYamlObjectsError extends Error {
  matchedObjects: YamlObject[];
  constructor(matchedObjects: YamlObject[]) {
    super('Matched multiple yaml objects');
    this.matchedObjects = matchedObjects;
  }
}
