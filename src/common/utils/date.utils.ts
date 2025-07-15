// utils/date.utils.ts
import { DateTime } from 'luxon';

export const KST = 'Asia/Seoul';

export const DateUtils = {
  startOfDay(date: string) {
    return DateTime.fromISO(date, { zone: KST }).startOf('day').toJSDate();
  },
  endOfDay(date: string) {
    return DateTime.fromISO(date, { zone: KST }).endOf('day').toJSDate();
  },
  formatKst(date: Date) {
    return DateTime.fromJSDate(date, { zone: KST }).toFormat('yyyy-LL-dd');
  },
  getKstDayOfWeek(date: Date) {
    const dowKo = ['일', '월', '화', '수', '목', '금', '토'];
    return dowKo[DateTime.fromJSDate(date, { zone: KST }).weekday % 7];
  },
};
