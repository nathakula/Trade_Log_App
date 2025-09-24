// NASDAQ Trading Holidays for 2024-2025
const tradingHolidays = [
  // 2024 Holidays
  { date: '2024-01-01', name: "New Year's Day" },
  { date: '2024-01-15', name: 'Martin Luther King Jr. Day' },
  { date: '2024-02-19', name: "Presidents' Day" },
  { date: '2024-03-29', name: 'Good Friday' },
  { date: '2024-05-27', name: 'Memorial Day' },
  { date: '2024-06-19', name: 'Juneteenth' },
  { date: '2024-07-04', name: 'Independence Day' },
  { date: '2024-09-02', name: 'Labor Day' },
  { date: '2024-11-28', name: 'Thanksgiving Day' },
  { date: '2024-12-25', name: 'Christmas Day' },
  
  // 2025 Holidays
  { date: '2025-01-01', name: "New Year's Day" },
  { date: '2025-01-20', name: 'Martin Luther King Jr. Day' },
  { date: '2025-02-17', name: "Presidents' Day" },
  { date: '2025-04-18', name: 'Good Friday' },
  { date: '2025-05-26', name: 'Memorial Day' },
  { date: '2025-06-19', name: 'Juneteenth' },
  { date: '2025-07-04', name: 'Independence Day' },
  { date: '2025-09-01', name: 'Labor Day' },
  { date: '2025-11-27', name: 'Thanksgiving Day' },
  { date: '2025-12-25', name: 'Christmas Day' },
];

export const getTradingHoliday = (dateString: string) => {
  return tradingHolidays.find(holiday => holiday.date === dateString);
};

export const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

export const isTradingDay = (dateString: string) => {
  const date = new Date(dateString);
  return !isWeekend(date) && !getTradingHoliday(dateString);
};