export interface ILogger {
  error(_message: string, ..._args: unknown[]): void;
  warn(_message: string, ..._args: unknown[]): void;
  info(_message: string, ..._args: unknown[]): void;
  debug(_message: string, ..._args: unknown[]): void;
}
