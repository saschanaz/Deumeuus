import { iterate } from "./iterate";
import TootBox from "./ui/tootbox";

export default function runTootBoxTimeRefesher(interval = 30000) {
  return setInterval(() => {
    const tootboxes = document.getElementsByTagName("deu-tootbox") as any as HTMLCollectionOf<TootBox>;
    for (const tootbox of iterate(tootboxes)) {
      tootbox.updateTimeText();
    }
  }, interval);
}
