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
    "123 Le Duan, Hai Chau, Da Nang",
    "45 Nguyen Van Linh, Thanh Khe, Da Nang",
    "KTX Bach Khoa Da Nang"
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
    if (!items.length) return "Chua co san pham trong gio.";
    if (!name.trim()) return "Vui long nhap ten nguoi nhan.";
    if (!phone.trim()) return "Vui long nhap so dien thoai.";
    if (!address.trim()) return "Vui long nhap dia chi giao nhan.";
    if (unavailableItems.length > 0) return "Co san pham bi trung lich.";

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
        <h2>Dat lich thue</h2>
        <p>Chon ngay nhan, ngay tra va thong tin giao nhan.</p>
      </section>

      {items.length === 0 ? (
        <div className="card empty-state">
          <p>Chua co san pham trong gio.</p>
          <Link to="/cart" className="btn-primary inline-btn">
            Quay lai gio hang
          </Link>
        </div>
      ) : (
        <div className="page-grid booking-grid">
          <section className="stack">
            <article className="card">
              <h3>Lich thue</h3>

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
                    {days} ngay
                  </button>
                ))}
              </div>

              <p className="meta-text mt-2">
                {format(startDate, "dd/MM/yyyy")} den {format(endDate, "dd/MM/yyyy")} ({rentalDays} ngay)
              </p>
            </article>

            <article className="card stack compact-gap">
              <h3>Thong tin khach hang</h3>

              <input
                className="input"
                placeholder="Ten nguoi nhan"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              <input
                className="input"
                placeholder="So dien thoai"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />

              <select
                className="input"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              >
                <option value="">Chon dia chi co san</option>
                {savedAddresses.map((itemAddress) => (
                  <option key={itemAddress} value={itemAddress}>
                    {itemAddress}
                  </option>
                ))}
              </select>

              <input
                className="input"
                placeholder="Hoac nhap dia chi moi"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />

              <textarea
                className="input textarea"
                placeholder="Ghi chu giao nhan"
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
                      Co {item.size} x{item.quantity}
                    </p>
                  </div>
                  <div className="booking-item-right">
                    <strong>{formatCurrency(item.pricePerDay * item.quantity)}</strong>
                    <span className={`status-chip ${item.available ? "available" : "unavailable"}`}>
                      {item.available ? "Con lich" : "Trung lich"}
                    </span>
                  </div>
                </div>
              ))}
            </article>
          </section>

          <aside className="card summary-card">
            <h3>Chi tiet dat lich</h3>

            <div className="summary-row">
              <span>So ngay thue</span>
              <span>{rentalDays} ngay</span>
            </div>

            <div className="summary-row">
              <span>Tam tinh</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="summary-row">
              <span>Giam gia dai ngay</span>
              <span>-{formatCurrency(discount)}</span>
            </div>

            <div className="summary-total">
              <span>Tong thanh toan</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button type="button" className="btn-primary" onClick={handleContinuePayment}>
              TIEP TUC THANH TOAN
            </button>
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
