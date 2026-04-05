export const formatCurrency = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(value)}d`;

export const formatDate = (value) => {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
};

export const getRentalDays = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return 0;
  }

  const from = new Date(startDate);
  const to = new Date(endDate);

  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);

  if (to < from) {
    return 0;
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to - from) / millisecondsPerDay) + 1;
};
