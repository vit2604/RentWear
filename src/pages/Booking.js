import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DateRange } from "react-date-range";
import { addDays, differenceInDays, format } from "date-fns";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { getProductById, isDateRangeAvailable } from "../data/products";
import { formatCurrency } from "../utils/format";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function Booking() {
  const navigate = useNavigate();
  const { booking, cart, checkoutItems, products, setBooking, user } = useAppContext();

  const items = checkoutItems.length ? checkoutItems : cart;

  const [range, setRange] = useState([
    {
      startDate: booking?.startDate ? new Date(booking.startDate) : new Date(),
      endDate: booking?.endDate ? new Date(booking.endDate) : addDays(new Date(), 2),
      key: "selection"
    }
  ]);

  const [quickDay, setQuickDay] = useState(2);
  const [note, setNote] = useState(booking?.note || "");
  const [name, setName] = useState(booking?.customer?.name || user?.name || "");
  const [phone, setPhone] = useState(booking?.customer?.phone || user?.phone || "");
  const [address, setAddress] = useState(booking?.customer?.address || user?.address || "");
  const [savedAddresses] = useState([
    "123 Lê Duẩn, Hải Châu, Đà Nẵng",
    "45 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng",
    "KTX Bách Khoa Đà Nẵng"
  ]);
  const [errorMessage, setErrorMessage] = useState("");

  const startDate = range[0].startDate;
  const endDate = range[0].endDate;
  const rentalDays = Math.max(differenceInDays(endDate, startDate), 1);

  const itemsWithAvailability = useMemo(
    () =>
      items.map((item) => {
        const product = getProductById(products, item.productId);
        const available = isDateRangeAvailable(product, startDate, endDate);

        return { ...item, product, available };
      }),
    [endDate, items, products, startDate]
  );

  const unavailableItems = itemsWithAvailability.filter((item) => !item.available);

  const subtotal = itemsWithAvailability.reduce(
    (total, item) => total + item.pricePerDay * item.quantity * rentalDays,
    0
  );

  const discount = rentalDays >= 5 ? Math.round(subtotal * 0.05) : 0;
  const shippingFee = 0;
  const total = subtotal + shippingFee - discount;

  const handleQuickDays = (days) => {
    setQuickDay(days);
    setRange([
      {
        startDate,
        endDate: addDays(startDate, days),
        key: "selection"
      }
    ]);
  };

  const validate = () => {
    if (!items.length) return "Chưa có sản phẩm trong giỏ.";
    if (!name.trim()) return "Vui lòng nhập tên người nhận.";
    if (!phone.trim()) return "Vui lòng nhập số điện thoại.";
    if (!address.trim()) return "Vui lòng nhập địa chỉ giao nhận.";
    if (unavailableItems.length > 0) return "Có sản phẩm bị trùng lịch.";

    return "";
  };

  const handleContinuePayment = () => {
    const error = validate();
    if (error) {
      setErrorMessage(error);
      return;
    }

    const startDateIso = startDate.toISOString().split("T")[0];
    const endDateIso = endDate.toISOString().split("T")[0];

    setBooking({
      startDate: startDateIso,
      endDate: endDateIso,
      days: rentalDays,
      items,
      subtotal,
      discount,
      shippingFee,
      total,
      customer: {
        name,
        phone,
        address
      },
      note
    });

    navigate("/payment");
  };

  return (
    <MainLayout>
      <section className="section-heading section-heading-left">
        <h2>Đặt lịch thuê</h2>
        <p>Chọn ngày nhận, ngày trả và thông tin giao nhận.</p>
      </section>

      {items.length === 0 ? (
        <div className="card empty-state">
          <p>Chưa có sản phẩm trong giỏ.</p>
          <Link to="/cart" className="btn-primary inline-btn">
            Quay lại giỏ hàng
          </Link>
        </div>
      ) : (
        <div className="page-grid booking-grid">
          <section className="stack">
            <article className="card">
              <h3>Lịch thuê</h3>

              <DateRange
                ranges={range}
                onChange={(item) => setRange([item.selection])}
                minDate={new Date()}
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {[1, 2, 3, 5].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleQuickDays(days)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      quickDay === days ? "bg-[#1f1f1f] text-white" : "bg-white"
                    }`}
                  >
                    {days} ngày
                  </button>
                ))}
              </div>

              <p className="meta-text mt-2">
                {format(startDate, "dd/MM/yyyy")} đến {format(endDate, "dd/MM/yyyy")} ({rentalDays} ngày)
              </p>
            </article>

            <article className="card stack compact-gap">
              <h3>Thông tin khách hàng</h3>

              <input
                className="input"
                placeholder="Tên người nhận"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              <input
                className="input"
                placeholder="Số điện thoại"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />

              <select
                className="input"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              >
                <option value="">Chọn địa chỉ có sẵn</option>
                {savedAddresses.map((itemAddress) => (
                  <option key={itemAddress} value={itemAddress}>
                    {itemAddress}
                  </option>
                ))}
              </select>

              <input
                className="input"
                placeholder="Hoặc nhập địa chỉ mới"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />

              <textarea
                className="input textarea"
                placeholder="Ghi chú giao nhận"
                value={note}
                onChange={(event) => setNote(event.target.value)}
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
              <span>Tạm tính</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="summary-row">
              <span>Giảm giá dài ngày</span>
              <span>-{formatCurrency(discount)}</span>
            </div>

            <div className="summary-total">
              <span>Tổng thanh toán</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button type="button" className="btn-primary" onClick={handleContinuePayment}>
              TIẾP TỤC THANH TOÁN
            </button>
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
