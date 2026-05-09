import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { DateRange } from "react-date-range";
import { addDays, eachDayOfInterval, format, isBefore, isValid, startOfDay } from "date-fns";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { getProductById, getRealtimeStatus, isDateRangeAvailable } from "../data/products";
import { formatCurrency, getRentalDays } from "../utils/format";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const statusLabels = {
  available: "Sẵn hàng",
  unavailable: "Tạm hết"
};

const toYmd = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const fromYmd = (value) => {
  if (!value) {
    return startOfDay(new Date());
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const buildDisabledDates = (product) => {
  if (!product?.blockedDates?.length) {
    return [];
  }

  const byKey = new Map();

  product.blockedDates.forEach((slot) => {
    const start = fromYmd(slot.start);
    const end = fromYmd(slot.end);

    if (!isValid(start) || !isValid(end) || isBefore(end, start)) {
      return;
    }

    eachDayOfInterval({ start, end }).forEach((day) => {
      byKey.set(toYmd(day), day);
    });
  });

  return Array.from(byKey.values());
};

const findNextAvailableRange = (product, duration = 2, maxDaysToSearch = 180) => {
  if (!product) {
    return null;
  }

  const safeDuration = Math.max(1, duration);
  const today = startOfDay(new Date());

  for (let offset = 0; offset <= maxDaysToSearch; offset += 1) {
    const startDate = addDays(today, offset);
    const endDate = addDays(startDate, safeDuration - 1);

    if (isDateRangeAvailable(product, toYmd(startDate), toYmd(endDate))) {
      return { startDate, endDate };
    }
  }

  return null;
};

const createInitialRange = (product) => {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  if (!product) {
    return { startDate: today, endDate: tomorrow };
  }

  if (isDateRangeAvailable(product, toYmd(today), toYmd(tomorrow))) {
    return { startDate: today, endDate: tomorrow };
  }

  return findNextAvailableRange(product, 2) || { startDate: today, endDate: tomorrow };
};

export default function ProductDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { addToCart, products, setBooking, setCheckoutItems } = useAppContext();

  const product = getProductById(products, id);

  const [size, setSize] = useState(product?.defaultSize || "M");
  const [quantity, setQuantity] = useState(1);
  const [preferredDays, setPreferredDays] = useState(2);
  const [range, setRange] = useState(() => [
    {
      ...createInitialRange(product),
      key: "selection"
    }
  ]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isMobileView, setIsMobileView] = useState(() =>
    window.matchMedia("(max-width: 992px)").matches
  );

  const rentalOptionsRef = useRef(null);

  const scrollToRental = () => {
    rentalOptionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (location.state?.focus === "rent-options") {
      setTimeout(scrollToRental, 120);
    }
  }, [location.state]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 992px)");
    const onChange = (event) => setIsMobileView(event.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    }

    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, []);

  const startDateObj = range[0].startDate;
  const endDateObj = range[0].endDate;
  const startDate = toYmd(startDateObj);
  const endDate = toYmd(endDateObj);

  const disabledDates = useMemo(() => buildDisabledDates(product), [product]);

  const rentalDays = useMemo(() => getRentalDays(startDate, endDate), [startDate, endDate]);

  if (!product) {
    return (
      <MainLayout>
        <div className="card empty-state">
          <p>Không tìm thấy sản phẩm.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate("/product")}>
            Quay lại danh sách
          </button>
        </div>
      </MainLayout>
    );
  }

  const hasStock = getRealtimeStatus(product) === "available";
  const isDateAvailable = isDateRangeAvailable(product, startDate, endDate);
  const canRentNow = hasStock && isDateAvailable;

  const availableUnits = Math.max(0, product.stock - product.rented);
  const maxQuantity = Math.max(1, availableUnits);

  const subtotal = product.pricePerDay * quantity * Math.max(1, rentalDays);

  const applyRange = (nextStart, nextEnd) => {
    const safeStart = startOfDay(nextStart);
    const safeEnd = isBefore(nextEnd, safeStart) ? safeStart : startOfDay(nextEnd);

    setRange([
      {
        startDate: safeStart,
        endDate: safeEnd,
        key: "selection"
      }
    ]);
  };

  const handleRangeChange = (item) => {
    const selection = item.selection;

    if (!selection?.startDate || !selection?.endDate) {
      return;
    }

    applyRange(selection.startDate, selection.endDate);

    const nextStart = toYmd(selection.startDate);
    const nextEnd = toYmd(selection.endDate);

    if (!isDateRangeAvailable(product, nextStart, nextEnd)) {
      setErrorMessage("Khoảng ngày này trùng lịch. Bấm 'Gợi ý lịch trống' để hệ thống tự chọn.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleQuickDays = (days) => {
    setPreferredDays(days);

    const nextStart = startDateObj;
    const nextEnd = addDays(nextStart, days - 1);

    if (isDateRangeAvailable(product, toYmd(nextStart), toYmd(nextEnd))) {
      applyRange(nextStart, nextEnd);
      setErrorMessage("");
      setSuccessMessage("");
      return;
    }

    const suggested = findNextAvailableRange(product, days);

    if (suggested) {
      applyRange(suggested.startDate, suggested.endDate);
      setErrorMessage(
        `Khoảng bạn chọn đã kín lịch. Hệ thống gợi ý lịch gần nhất: ${format(
          suggested.startDate,
          "dd/MM/yyyy"
        )} - ${format(suggested.endDate, "dd/MM/yyyy")}.`
      );
      return;
    }

    setErrorMessage("Không còn lịch trống phù hợp trong thời gian tới.");
  };

  const handleSuggestRange = () => {
    const suggested = findNextAvailableRange(product, preferredDays);

    if (!suggested) {
      setErrorMessage("Không tìm thấy lịch trống phù hợp để gợi ý.");
      return;
    }

    applyRange(suggested.startDate, suggested.endDate);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleManualDateChange = (field, value) => {
    const pickedDate = fromYmd(value);

    if (field === "start") {
      const nextEnd = isBefore(endDateObj, pickedDate) ? pickedDate : endDateObj;
      applyRange(pickedDate, nextEnd);
    } else {
      applyRange(startDateObj, pickedDate);
    }

    const nextStart = field === "start" ? value : startDate;
    const nextEnd = field === "end" ? value : endDate;

    if (!isDateRangeAvailable(product, nextStart, nextEnd)) {
      setErrorMessage("Khoảng ngày này trùng lịch. Bấm 'Gợi ý lịch trống' để hệ thống tự chọn.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
  };

  const createItemPayload = () => ({
    productId: product.id,
    name: product.name,
    image: product.image,
    pricePerDay: product.pricePerDay,
    size,
    quantity
  });

  const handleAddToCart = () => {
    if (!hasStock || availableUnits <= 0) {
      setErrorMessage("Sản phẩm đang tạm hết, chưa thể thêm vào giỏ.");
      scrollToRental();
      return;
    }

    for (let index = 0; index < quantity; index += 1) {
      addToCart(product, size);
    }

    setErrorMessage("");
    setSuccessMessage("Đã thêm vào giỏ hàng. Bạn có thể tiếp tục chọn hoặc đặt thuê ngay.");
  };

  const handleRentNow = () => {
    if (!hasStock || availableUnits <= 0) {
      setErrorMessage("Sản phẩm đang tạm hết, chưa thể thuê ngay.");
      scrollToRental();
      return;
    }

    if (rentalDays <= 0) {
      setErrorMessage("Ngày thuê không hợp lệ.");
      scrollToRental();
      return;
    }

    if (!isDateAvailable) {
      setErrorMessage("Sản phẩm đang trùng lịch cho khoảng ngày đã chọn.");
      scrollToRental();
      return;
    }

    const item = createItemPayload();
    const discount = rentalDays >= 5 ? Math.round(subtotal * 0.05) : 0;

    setCheckoutItems([item]);
    setBooking({
      startDate,
      endDate,
      note: "",
      days: rentalDays,
      items: [item],
      subtotal,
      shippingFee: 0,
      discount,
      total: subtotal - discount
    });

    navigate("/payment", { state: { focus: "methods" } });
  };

  return (
    <MainLayout>
      <div className="stack has-mobile-sticky">
        <button type="button" className="btn-link" onClick={() => navigate("/product")}>
          ← Quay lại sản phẩm
        </button>

        <section className="card">
          <div className="product-layout items-start">
            <img
              src={product.image}
              alt={product.name}
              className="product-image h-[280px] rounded-[12px] sm:h-[360px] lg:h-[420px]"
            />

            <div ref={rentalOptionsRef} className="stack scroll-anchor">
              <div>
                <p className="product-category">{product.category}</p>
                <h2 className="m-0 font-display text-[2rem]">{product.name}</h2>
                <p className="meta-text">{product.description}</p>
              </div>

              <div className="product-detail-row">
                <span>Giá thuê theo ngày</span>
                <strong>{formatCurrency(product.pricePerDay)}</strong>
              </div>
              <div className="product-detail-row">
                <span>Tình trạng hiện tại</span>
                <strong>{statusLabels[getRealtimeStatus(product)]}</strong>
              </div>
              <div className="product-detail-row">
                <span>Khả dụng theo ngày đã chọn</span>
                <strong>{canRentNow ? "Còn lịch" : hasStock ? "Trùng lịch" : "Tạm hết"}</strong>
              </div>

              <article className="rounded-xl border border-line bg-[#fbf8f2] p-3">
                <h3 className="!mb-2 !mt-0 text-base">Chọn lịch thuê thông minh</h3>

                <DateRange
                  ranges={range}
                  onChange={handleRangeChange}
                  minDate={startOfDay(new Date())}
                  disabledDates={disabledDates}
                  moveRangeOnFirstSelection={false}
                  months={isMobileView ? 1 : 2}
                  direction={isMobileView ? "vertical" : "horizontal"}
                  showDateDisplay={!isMobileView}
                  rangeColors={["#8d5f31"]}
                />

                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 2, 3, 5].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleQuickDays(days)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        preferredDays === days ? "bg-[#1f1f1f] text-white" : "bg-white"
                      }`}
                    >
                      {days} ngày
                    </button>
                  ))}

                  <button type="button" className="btn-outline" onClick={handleSuggestRange}>
                    Gợi ý lịch trống
                  </button>
                </div>

                <p className="meta-text mt-2">
                  Đã chọn: {format(startDateObj, "dd/MM/yyyy")} - {format(endDateObj, "dd/MM/yyyy")} ({Math.max(1, rentalDays)} ngày)
                </p>
              </article>

              <div className="field-row">
                <div>
                  <label htmlFor="start-date" className="label-text">
                    Ngày nhận đồ
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    className="input"
                    value={startDate}
                    onChange={(event) => handleManualDateChange("start", event.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="end-date" className="label-text">
                    Ngày trả đồ
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    className="input"
                    value={endDate}
                    onChange={(event) => handleManualDateChange("end", event.target.value)}
                  />
                </div>
              </div>

              <div className="field-row">
                <div>
                  <label htmlFor="size-select" className="label-text">
                    Chọn cỡ
                  </label>
                  <select id="size-select" className="input" value={size} onChange={(event) => setSize(event.target.value)}>
                    {product.sizeOptions.map((itemSize) => (
                      <option key={itemSize} value={itemSize}>
                        Cỡ {itemSize}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="qty-select" className="label-text">
                    Số lượng
                  </label>
                  <input
                    id="qty-select"
                    type="number"
                    min={1}
                    max={maxQuantity}
                    className="input"
                    value={quantity}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value) || 1;
                      setQuantity(Math.max(1, Math.min(maxQuantity, nextValue)));
                    }}
                  />
                </div>
              </div>

              <div className="summary-total !border-b !border-[#ece5d9] !pt-0">
                <span>Tạm tính ({Math.max(1, rentalDays)} ngày)</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>

              {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
              {successMessage ? <p className="form-success">{successMessage}</p> : null}

              <div className="button-row">
                <button type="button" className="btn-secondary" onClick={handleAddToCart}>
                  Thêm vào giỏ
                </button>
                <button type="button" className="btn-primary" onClick={handleRentNow}>
                  Thuê ngay
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mobile-sticky-action" role="region" aria-label="Tóm tắt thuê nhanh">
          <div className="mobile-sticky-action-row">
            <div className="mobile-sticky-meta">
              <span className="mobile-sticky-label">Tạm tính</span>
              <strong className="mobile-sticky-value">{formatCurrency(subtotal)}</strong>
            </div>
            <button type="button" className="btn-primary mobile-sticky-button" onClick={handleRentNow}>
              Thuê ngay
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
