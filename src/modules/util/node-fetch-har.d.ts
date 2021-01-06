declare module 'node-fetch-har' {
  export function createHarLog(logs: any[]): Record<string, any>;
  export function withHar<T extends unknown>(
    fn: T,
    args: {
      onHarEntry(entry: any): void;
    }
  ): T;
}
