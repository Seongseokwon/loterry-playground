export function randomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new RangeError("maxExclusive는 양의 정수여야 합니다.");
  const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % maxExclusive;
}
