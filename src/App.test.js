import { formatCurrency, getRentalDays } from "./utils/format";

describe("format utils", () => {
  test("formatCurrency formats value in vi-VN style", () => {
    expect(formatCurrency(120000)).toBe("120.000đ");
  });

  test("getRentalDays counts both start and end day", () => {
    expect(getRentalDays("2026-04-25", "2026-04-26")).toBe(2);
  });
});
