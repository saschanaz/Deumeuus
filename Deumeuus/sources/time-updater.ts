import TootBox from "./ui/tootbox";

export default function runTootBoxTimeRefesher(interval = 30000) {
  return setInterval(() => {
    const tootboxes = document.getElementsByTagName("deu-tootbox") as any as HTMLCollectionOf<TootBox>;
    for (const tootbox of iterate(tootboxes)) {
      tootbox.updateTimeText();
    }
  }, interval);
}

function* iterate<T extends Element>(iterable: HTMLCollectionOf<T>) {
  if (HTMLCollection.prototype[Symbol.iterator]) {
    yield* iterable[Symbol.iterator]();
  }
  for (let i = 0; i < iterable.length; i++) {
    yield iterable[i];
  }
}