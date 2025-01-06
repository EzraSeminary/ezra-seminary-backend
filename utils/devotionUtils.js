const { EthDateTime } = require("ethiopian-calendar-date-converter");

const ethiopianMonths = [
  "",
  "መስከረም",
  "ጥቅምት",
  "ህዳር",
  "ታህሳስ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዚያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜ",
];

const convertToEthiopianDate = (date) => {
  const ethDateTime = EthDateTime.fromEuropeanDate(date);
  return [ethDateTime.year, ethDateTime.month, ethDateTime.date];
};

const getMonthIndex = (monthName) => {
  const reversedMonths = [...ethiopianMonths].reverse();
  return reversedMonths.indexOf(monthName);
};

const findDevotion = (devotions, offset, today) => {
  const date = new Date(today);
  date.setDate(today.getDate() - offset);
  const [, m, d] = convertToEthiopianDate(date);
  const monthName = ethiopianMonths[m];
  console.log(`Checking for devotion on: ${monthName} ${d}`);
  return devotions.find(
    (devotion) => devotion.month === monthName && Number(devotion.day) === d
  );
};

const sortMonths = (devotionsByMonth) => {
  const sortedMonths = Object.keys(devotionsByMonth).sort((a, b) => {
    const monthIndexA = getMonthIndex(a);
    const monthIndexB = getMonthIndex(b);
    return monthIndexA - monthIndexB; // Sort in reverse order
  });

  const currentMonth = convertToEthiopianDate(new Date())[1];
  const currentMonthName = ethiopianMonths[currentMonth];
  const currentMonthIndex = sortedMonths.indexOf(currentMonthName);
  return [
    ...sortedMonths.slice(currentMonthIndex),
    ...sortedMonths.slice(0, currentMonthIndex),
  ];
};

const sortDevotionsByDayDescending = (devotions) => {
  return devotions.sort((a, b) => {
    const dayA = Number(a.day);
    const dayB = Number(b.day);
    return dayB - dayA; // Descending order
  });
};

const sortMonthsChronologically = (devotionsByMonth) => {
  const sortedMonths = Object.keys(devotionsByMonth).sort((a, b) => {
    const monthIndexA = ethiopianMonths.indexOf(a);
    const monthIndexB = ethiopianMonths.indexOf(b);
    return monthIndexA - monthIndexB;
  });
  return sortedMonths;
};

module.exports = {
  ethiopianMonths,
  convertToEthiopianDate,
  getMonthIndex,
  findDevotion,
  sortMonths,
  sortDevotionsByDayDescending,
  sortMonthsChronologically,
};
