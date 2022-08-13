export class Client {
  constructor(key?: string);

  public connect(key: string);

  // Native
  public get(key: string, options?: { raw?: boolean }): Promise<unknown>;
  public set(key: string, value: any, options?: { raw?: boolean }): Client;
  public delete(key: string): Client;
  public list(prefix?: string): Promise<string[]>;

  // Dynamic
  public empty(): Client;
  public getAll(): Record<any, any>;
  public setAll(obj: Record<any, any>): Client;
  public deleteMultiple(...args: string[]): Client;
}
