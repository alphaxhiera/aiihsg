// Indonesian Stock Exchange (BEI / IDX) Market Time & Session Utilities

export interface MarketInfo {
  isMarketOpen: boolean;
  statusText: string;
  statusDetail: string;
  badgeType: 'open' | 'closed' | 'break' | 'pre-open';
  wibDate: Date;
  wibFormattedDate: string; // e.g. "Sabtu, 19 Sep 2026"
  wibFormattedTime: string; // e.g. "19:50:00 WIB"
  latestTradingDate: Date;
  latestTradingDateIso: string; // e.g. "2026-09-18"
  latestTradingDateFormatted: string; // e.g. "Jumat, 18 Sep 2026"
  lastCloseSession: string; // e.g. "Penutupan Sesi 2 (16:00 WIB)"
}

const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const INDO_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Converts a standard Date to Jakarta/WIB Time components (UTC+7)
 */
export function getWIBComponents(date: Date = new Date()) {
  // Use Intl format to get exact Jakarta parts reliably
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(date);
  const findPart = (type: string) => {
    const p = parts.find((item) => item.type === type);
    return p ? parseInt(p.value, 10) : 0;
  };

  const year = findPart('year') || date.getFullYear();
  const month = (findPart('month') || (date.getMonth() + 1)) - 1; // 0-indexed
  const day = findPart('day') || date.getDate();
  const hour = findPart('hour') || date.getHours();
  const minute = findPart('minute') || date.getMinutes();
  const second = findPart('second') || date.getSeconds();

  // Create clean date representation for Jakarta
  const wibDate = new Date(year, month, day, hour, minute, second);
  const dayOfWeek = wibDate.getDay(); // 0 = Sun, 6 = Sat

  return { year, month, day, hour, minute, second, dayOfWeek, wibDate };
}

/**
 * Format date in Indonesian standard
 */
export function formatIndoDate(d: Date): string {
  const dayName = INDO_DAYS[d.getDay()];
  const day = d.getDate();
  const monthName = INDO_MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

/**
 * Format short date (e.g. "18 Sep" or "18/09") for chart x-axis
 */
export function formatShortDate(dateStrOrObj: string | Date): string {
  if (!dateStrOrObj) return '';
  let d: Date;
  if (typeof dateStrOrObj === 'string') {
    const parts = dateStrOrObj.split('-');
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(dateStrOrObj);
    }
  } else {
    d = dateStrOrObj;
  }
  const day = d.getDate();
  const month = INDO_MONTHS_SHORT[d.getMonth()] || `${d.getMonth() + 1}`;
  return `${day} ${month}`;
}

/**
 * Determines current IDX market session & whether the market is open or closed,
 * and calculates the exact latest available trading session date.
 */
export function getMarketInfo(now: Date = new Date()): MarketInfo {
  const { year, month, day, hour, minute, second, dayOfWeek, wibDate } = getWIBComponents(now);
  const totalMinutes = hour * 60 + minute;

  let isMarketOpen = false;
  let statusText = 'Market Closed';
  let statusDetail = 'Tutup Pasar BEI';
  let badgeType: 'open' | 'closed' | 'break' | 'pre-open' = 'closed';
  let lastCloseSession = 'Penutupan Sesi 2 (16:00 WIB)';

  // Calculate Latest Trading Date (Last Market Session)
  // If market is currently open, latest trading date is today.
  // If market is closed, determine latest completed session.
  const latestTradingDate = new Date(year, month, day);

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  const isFriday = dayOfWeek === 5;

  if (isWeekend) {
    isMarketOpen = false;
    badgeType = 'closed';
    statusText = 'Market Tutup (Akhir Pekan)';
    statusDetail = 'Bursa Buka Kembali Senin 09:00 WIB';
    lastCloseSession = 'Penutupan Jumat (16:00 WIB)';

    // Step back to Friday
    const daysToSubtract = dayOfWeek === 6 ? 1 : 2; // Saturday = 1 day ago (Fri), Sunday = 2 days ago (Fri)
    latestTradingDate.setDate(latestTradingDate.getDate() - daysToSubtract);
  } else {
    // Monday - Friday
    // Sesi 1: 09:00 - 12:00 (Friday: 09:00 - 11:30)
    // Break: 12:00 - 13:30 (Friday: 11:30 - 14:00)
    // Sesi 2: 13:30 - 15:49 (Friday: 14:00 - 15:49)
    // Pre-closing: 15:50 - 16:00
    const sesi1Start = 9 * 60; // 09:00
    const sesi1End = isFriday ? 11 * 60 + 30 : 12 * 60; // 11:30 on Fri, 12:00 Mon-Thu
    const sesi2Start = isFriday ? 14 * 60 : 13 * 60 + 30; // 14:00 on Fri, 13:30 Mon-Thu
    const sesi2End = 15 * 60 + 50; // 15:50
    const marketClose = 16 * 60; // 16:00

    if (totalMinutes < 8 * 60 + 45) {
      // 00:00 - 08:45 WIB: Market closed before opening
      isMarketOpen = false;
      badgeType = 'closed';
      statusText = 'Market Tutup (Pra-Bursa)';
      statusDetail = 'Bursa Buka Pukul 09:00 WIB';

      // Latest completed data was yesterday (or Friday if today is Monday)
      const daysToSubtract = dayOfWeek === 1 ? 3 : 1;
      latestTradingDate.setDate(latestTradingDate.getDate() - daysToSubtract);
      lastCloseSession = 'Penutupan Sesi 2 (16:00 WIB)';
    } else if (totalMinutes >= 8 * 60 + 45 && totalMinutes < sesi1Start) {
      // 08:45 - 08:59 WIB: Pre-opening
      isMarketOpen = false;
      badgeType = 'pre-open';
      statusText = 'Pre-Opening';
      statusDetail = 'Pembentukan Harga Pembukaan';

      // Latest completed data was previous trading day
      const daysToSubtract = dayOfWeek === 1 ? 3 : 1;
      latestTradingDate.setDate(latestTradingDate.getDate() - daysToSubtract);
      lastCloseSession = 'Penutupan Sesi Sebelumnya';
    } else if (totalMinutes >= sesi1Start && totalMinutes < sesi1End) {
      // Regular Sesi 1
      isMarketOpen = true;
      badgeType = 'open';
      statusText = 'Market Buka (Sesi 1)';
      statusDetail = isFriday ? 'Sesi 1 Berakhir 11:30 WIB' : 'Sesi 1 Berakhir 12:00 WIB';
      lastCloseSession = 'Perdagangan Berjalan (Live)';
    } else if (totalMinutes >= sesi1End && totalMinutes < sesi2Start) {
      // Break session
      isMarketOpen = false;
      badgeType = 'break';
      statusText = 'Market Istirahat';
      statusDetail = isFriday ? 'Sesi 2 Buka 14:00 WIB' : 'Sesi 2 Buka 13:30 WIB';
      lastCloseSession = 'Penutupan Sesi 1 (Siang)';
    } else if (totalMinutes >= sesi2Start && totalMinutes < sesi2End) {
      // Regular Sesi 2
      isMarketOpen = true;
      badgeType = 'open';
      statusText = 'Market Buka (Sesi 2)';
      statusDetail = 'Sesi 2 Berakhir 15:50 WIB';
      lastCloseSession = 'Perdagangan Berjalan (Live)';
    } else if (totalMinutes >= sesi2End && totalMinutes < marketClose) {
      // 15:50 - 16:00: Pre-Closing & Crossing
      isMarketOpen = false;
      badgeType = 'pre-open';
      statusText = 'Pre-Closing';
      statusDetail = 'Pembentukan Harga Penutupan BEI';
      lastCloseSession = 'Penutupan Sesi 2';
    } else {
      // 16:00 - 23:59: Market Closed for the day
      isMarketOpen = false;
      badgeType = 'closed';
      statusText = 'Market Tutup';
      statusDetail = 'Pasar Reguler BEI Selesai';
      lastCloseSession = 'Penutupan Sesi 2 (16:00 WIB)';
      // Latest completed data is TODAY's close!
    }
  }

  const isoYear = latestTradingDate.getFullYear();
  const isoMonth = String(latestTradingDate.getMonth() + 1).padStart(2, '0');
  const isoDay = String(latestTradingDate.getDate()).padStart(2, '0');
  const latestTradingDateIso = `${isoYear}-${isoMonth}-${isoDay}`;

  const wibFormattedDate = formatIndoDate(wibDate);
  const wibFormattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} WIB`;
  const latestTradingDateFormatted = formatIndoDate(latestTradingDate);

  return {
    isMarketOpen,
    statusText,
    statusDetail,
    badgeType,
    wibDate,
    wibFormattedDate,
    wibFormattedTime,
    latestTradingDate,
    latestTradingDateIso,
    latestTradingDateFormatted,
    lastCloseSession,
  };
}

/**
 * Generate historical trading day dates (excluding weekends)
 * ending precisely at the latestTradingDate.
 */
export function generateTradingDayDates(latestDate: Date, count = 35): string[] {
  const dates: string[] = [];
  const current = new Date(latestDate);

  while (dates.length < count) {
    const day = current.getDay();
    // Only include trading days (Mon - Fri)
    if (day !== 0 && day !== 6) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      dates.unshift(`${y}-${m}-${d}`);
    }
    current.setDate(current.getDate() - 1);
  }

  return dates;
}
