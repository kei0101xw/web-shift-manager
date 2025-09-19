const HOUR = 1000 * 60 * 60;
const DAY7 = 7 * 24 * HOUR;

const clipMs = (aS, aE, bS, bE) =>
  Math.max(
    0,
    Math.min(aE.getTime(), bE.getTime()) - Math.max(aS.getTime(), bS.getTime())
  );

function rollingLimitExceeded(existingIntervals, candidate, limitHours = 28) {
  const intervals = [
    ...existingIntervals.map((x) => ({
      start: new Date(x.start),
      end: new Date(x.end),
    })),
    { start: new Date(candidate.start), end: new Date(candidate.end) },
  ];
  const boundaries = [];
  for (const iv of intervals) boundaries.push(iv.start, iv.end);

  let maxHours = 0,
    worst = null;
  for (const t of boundaries) {
    const wStart = new Date(t.getTime() - DAY7),
      wEnd = t;
    let sumMs = 0;
    for (const iv of intervals) sumMs += clipMs(iv.start, iv.end, wStart, wEnd);
    const hours = sumMs / HOUR;
    if (hours > maxHours) {
      maxHours = hours;
      worst = { start: wStart, end: wEnd };
    }
  }
  return maxHours > limitHours
    ? { exceeded: true, maxHours: Number(maxHours.toFixed(2)), worst }
    : { exceeded: false };
}

module.exports = { HOUR, DAY7, clipMs, rollingLimitExceeded };
