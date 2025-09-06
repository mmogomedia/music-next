declare module 'bcryptjs' {
  export function compare(_data: string, _encrypted: string): Promise<boolean>;
  export function hash(_data: string, _saltRounds: number): Promise<string>;
  export function hashSync(_data: string, _saltRounds: number): string;
  export function compareSync(_data: string, _encrypted: string): boolean;
}
