export function formatKoreanDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long", timeZone: "Asia/Seoul" }).format(new Date(`${date}T00:00:00+09:00`));
}

export function formatWon(amount?: number) {
  if (amount === undefined) return "정보 없음";
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000);
    const man = Math.floor((amount % 100_000_000) / 10_000);
    return `${eok}억 ${man ? `${man.toLocaleString("ko-KR")}만 ` : ""}원`;
  }
  return `${amount.toLocaleString("ko-KR")}원`;
}
