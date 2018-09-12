declare module "event-source-polyfill" {
  export interface EventSourcePolyfillInit extends Partial<EventSourceInit> {
    headers?: object;
  }

  export class EventSourcePolyfill extends EventSource {
    constructor(url: string, eventSourceInitDict?: EventSourcePolyfillInit);
  }
}

declare module "dialog-polyfill" {
  export function registerDialog(dialog: HTMLUnknownElement | HTMLDialogElement): void;
}
