const sec = 1000;
const min = sec * 60;
const hour = min * 60;
const day = hour * 24;
const month = day * 30; // to simplify
const year = month * 12;

export function getRelativeTimeStatus(time: Date) {
  const diff = Date.now().valueOf() - time.valueOf();
  let text: string;
  if (diff < 500) { // sec * 0.5
    text = "방금";
  } else if (diff < min) { // less than 1 min
    text = `${Math.round(diff / sec)}초`;
  } else if (diff < hour) { // less than 1 hour
    text = `${Math.round(diff / min)}분`;
  } else if (diff < day) { // less than 24 hours
    text = `${Math.round(diff / hour)}시간`;
  } else if (diff < month) {
    text = `${Math.round(diff / day)}일`;
  } else if (diff < year) {
    text = `${Math.round(diff / month)}달`;
  } else {
    text = `${Math.round(diff / year)}년`;
  }
  return { diff, text };
}
