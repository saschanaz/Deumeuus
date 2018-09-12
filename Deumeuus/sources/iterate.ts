declare global {
  interface HTMLCollection {
    [Symbol.iterator](): IterableIterator<Element>;
  }
}

interface IndexedIterable<T> {
  [Symbol.iterator](): IterableIterator<T>;
  [index: number]: T;
  length: number;
}

export function* iterate<T>(iterable: IndexedIterable<T>) {
  if (iterable[Symbol.iterator]) {
    yield* iterable[Symbol.iterator]();
  }
  for (let i = 0; i < iterable.length; i++) {
    yield iterable[i];
  }
}
