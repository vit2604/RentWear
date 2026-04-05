import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { getProductById, isDateRangeAvailable } from "../data/products";
import { formatCurrency, getRentalDays } from "../utils/format";

const getDefaultDates = () => {
  const now = new Date();
  const start = now.toISOString().split("T")[0];

  const next = new Date(now);
  next.setDate(now.getDate() + 2);
  const end = next.toISOString().split("T")[0];

  return { start, end };
};

export default function Booking() {
  const navigate = useNavigate();
  const { booking, cart, checkoutItems, products, setBooking } = useAppContext();
  const fallbackDates = getDefaultDates();

  const [startDate, setStartDate] = useState(booking?.startDate || fallbackDates.start);
  const [endDate, setEndDate] = useState(booking?.endDate || fallbackDates.end);
  const [note, setNote] = useState(booking?.note || "");
  const [errorMessage, setErrorMessage] = useState("");

  const items = checkoutItems.length ? checkoutItems : cart;

  const itemsWithAvailability = useMemo(
    () =>
      items.map((item) => {
        const product = getProductById(products, item.productId);
        return {
          ...item,
          product,
          available: isDateRangeAvailable(product, startDate, endDate)
        };
      }),
    [endDate, items, products, startDate]
  );

  const unavailableItems = itemsWithAvailability.filter((item) => !item.available);
  const rentalDays = getRentalDays(startDate, endDate);

  const subtotal =
    rentalDays > 0
      ? itemsWithAvailability.reduce(
          (total, item) => total + item.pricePerDay * item.quantity * rentalDays,
          0
        )
      : 0;

  const shippingFee = 0;
  const discount = rentalDays >= 5 ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + shippingFee - discount;

  const handleContinuePayment = () => {
    if (!items.length) {
      setErrorMessage("Bạn chưa có sản phẩm nào trong giỏ hàng.");
      return;
    }

    if (!startDate || !endDate || rentalDays <= 0) {
      setErrorMessage("Vui lòng chọn ngày nhận và ngày trả hợp lệ.");
      return;
    }

    if (unavailableItems.length > 0) {
      setErrorMessage("Một số sản phẩm đã trùng lịch. Vui lòng đổi ngày thuê.");
      return;
    }

    setErrorMessage("");

    setBooking({
      startDate,
      endDate,
      note,
      days: rentalDays,
      items,
      subtotal,
      shippingFee,
      discount,
      total
    });

    navigate("/payment");
  };

  return (
    <MainLayout>
      <section className="section-heading section-heading-left">
        <h2>Đặt ngày thuê</h2>
        <p>Chọn ngày nhận, ngày trả. Hệ thống sẽ kiểm tra lịch trống tự động.</p>
      </section>

      {items.length === 0 ? (
        <div className="card empty-state">
          <p>Bạn chưa chọn sản phẩm để đặt lịch.</p>
          <Link to="/cart" className="btn-primary inline-btn">
            Quay lại giỏ hàng
          </Link>
        </div>
      ) : (
        <div className="page-grid booking-grid">
          <section className="stack">
            <article className="card">
              <h3>Thông tin lịch thuê</h3>

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
                    onChange={(event) => setStartDate(event.target.value)}
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
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>

              <label htmlFor="note" className="label-text">
                Ghi chú giao nhận
              </label>
              <textarea
                id="note"
                className="input textarea"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ví dụ: giao giờ hành chính tại nhà"
              />
            </article>

            <article className="card stack compact-gap">
              {itemsWithAvailability.map((item) => (
                <div className="booking-item" key={`${item.productId}-${item.size}`}>
                  <div>
                    <h4>{item.name}</h4>
                    <p className="meta-text">
                      Cỡ {item.size} x{item.quantity}
                    </p>
                  </div>
                  <div className="booking-item-right">
                    <strong>{formatCurrency(item.pricePerDay * item.quantity)}</strong>
                    <span className={`status-chip ${item.available ? "available" : "unavailable"}`}>
                      {item.available ? "Còn lịch" : "Trùng lịch"}
                    </span>
                  </div>
                </div>
              ))}
            </article>
          </section>

          <aside className="card summary-card">
            <h3>Chi tiết đặt lịch</h3>
            <div className="summary-row">
              <span>Số ngày thuê</span>
              <span>{rentalDays} ngày</span>
            </div>
            <div className="summary-row">
              <span>Phí vận chuyển</span>
              <span>{shippingFee === 0 ? "Miễn phí" : formatCurrency(shippingFee)}</span>
            </div>
            <div className="summary-row">
              <span>Giảm giá dài ngày</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
            <div className="summary-total">
              <span>Tổng thanh toán</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            {unavailableItems.length > 0 ? (
              <p className="form-error">
                Sản phẩm trùng lịch: {unavailableItems.map((item) => item.name).join(", ")}
              </p>
            ) : null}

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button
              type="button"
              className="btn-primary"
              onClick={handleContinuePayment}
            >
              TIẾP TỤC THANH TOÁN
            </button>
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
