export default function compareBigInt(x: string, y: string) {
  const lengthDiff = x.length - y.length;
  if (lengthDiff) {
    return lengthDiff;
  }
  return x.localeCompare(y);
}
