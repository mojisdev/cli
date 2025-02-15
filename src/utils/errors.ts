export class MojisNotImplemented extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MojisNotImplemented";
  }
}

export function isNotImplementedError(err: Error): err is MojisNotImplemented {
  return err instanceof MojisNotImplemented;
}
