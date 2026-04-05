export const initialProducts = [
  {
    id: "P001",
    name: "Trizzy Dress",
    category: "Váy",
    pricePerDay: 60000,
    sizeOptions: ["S", "M", "L"],
    defaultSize: "M",
    stock: 5,
    rented: 1,
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
    description: "Váy linen dáng suông, hợp đi tiệc nhẹ và sự kiện cuối tuần.",
    blockedDates: [
      { start: "2026-04-10", end: "2026-04-12" },
      { start: "2026-04-20", end: "2026-04-22" }
    ]
  },
  {
    id: "P002",
    name: "Classic Blazer",
    category: "Áo khoác",
    pricePerDay: 85000,
    sizeOptions: ["M", "L", "XL"],
    defaultSize: "L",
    stock: 4,
    rented: 3,
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
    description:
      "Blazer phom dáng đứng, chất liệu mềm nhẹ, dễ phối nhiều phong cách.",
    blockedDates: [{ start: "2026-04-06", end: "2026-04-08" }]
  },
  {
    id: "P003",
    name: "Minimal Jumpsuit",
    category: "Jumpsuit",
    pricePerDay: 95000,
    sizeOptions: ["S", "M", "L"],
    defaultSize: "M",
    stock: 3,
    rented: 1,
    image:
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=800&q=80",
    description:
      "Jumpsuit màu trung tính, tôn dáng và phù hợp chụp ảnh ngoại cảnh.",
    blockedDates: []
  },
  {
    id: "P004",
    name: "Premium Suit Set",
    category: "Vest",
    pricePerDay: 150000,
    sizeOptions: ["M", "L", "XL"],
    defaultSize: "M",
    stock: 2,
    rented: 2,
    image:
      "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80",
    description:
      "Bộ suit cao cấp dành cho sự kiện trang trọng, tông màu trắng kem.",
    blockedDates: [
      { start: "2026-04-04", end: "2026-04-15" },
      { start: "2026-04-25", end: "2026-04-27" }
    ]
  },
  {
    id: "P005",
    name: "Soft Knit Cardigan",
    category: "Áo",
    pricePerDay: 50000,
    sizeOptions: ["S", "M", "L"],
    defaultSize: "S",
    stock: 6,
    rented: 2,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    description: "Cardigan mềm nhẹ, hợp layering cho phong cách thu đông.",
    blockedDates: [{ start: "2026-04-18", end: "2026-04-19" }]
  },
  {
    id: "P006",
    name: "Evening Satin Dress",
    category: "Đầm",
    pricePerDay: 120000,
    sizeOptions: ["S", "M"],
    defaultSize: "S",
    stock: 3,
    rented: 0,
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
    description: "Đầm satin sang trọng, phù hợp tiệc tối và chụp lookbook.",
    blockedDates: [{ start: "2026-04-14", end: "2026-04-16" }]
  }
];

const toDate = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const overlaps = (startA, endA, startB, endB) =>
  startA <= endB && startB <= endA;

export const isDateRangeAvailable = (product, startDate, endDate) => {
  if (!product || !startDate || !endDate) {
    return true;
  }

  const requestStart = toDate(startDate);
  const requestEnd = toDate(endDate);

  if (requestEnd < requestStart) {
    return false;
  }

  return !product.blockedDates.some((slot) => {
    const blockedStart = toDate(slot.start);
    const blockedEnd = toDate(slot.end);
    return overlaps(requestStart, requestEnd, blockedStart, blockedEnd);
  });
};

export const getProductById = (productList, productId) =>
  productList.find((product) => product.id === productId);

export const getRealtimeStatus = (product) => {
  if (!product) {
    return "unknown";
  }

  return product.rented < product.stock ? "available" : "unavailable";
};
