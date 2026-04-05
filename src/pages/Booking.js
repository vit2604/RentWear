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
  const { booking, cart, checkoutItems, setBooking } = useAppContext();
  const fallbackDates = getDefaultDates();

  const [startDate, setStartDate] = useState(booking?.startDate || fallbackDates.start);
  const [endDate, setEndDate] = useState(booking?.endDate || fallbackDates.end);
  const [note, setNote] = useState(booking?.note || "");
  const [errorMessage, setErrorMessage] = useState("");

  const items = checkoutItems.length ? checkoutItems : cart;

  const itemsWithAvailability = useMemo(
    () =>
      items.map((item) => {
        const product = getProductById(item.productId);
        return {
          ...item,
          product,
          available: isDateRangeAvailable(product, startDate, endDate)
        };
      }),
    [endDate, items, startDate]
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
      setErrorMessage("Ban chua co san pham nao trong gio hang.");
      return;
    }

    if (!startDate || !endDate || rentalDays <= 0) {
      setErrorMessage("Vui long chon ngay nhan va ngay tra hop le.");
      return;
    }

    if (unavailableItems.length > 0) {
      setErrorMessage("Mot so san pham da trung lich. Vui long doi ngay thue.");
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
        <h2>Dat ngay thue</h2>
        <p>Chon ngay nhan, ngay tra. He thong se kiem tra lich trong tu dong.</p>
      </section>

      {items.length === 0 ? (
        <div className="card empty-state">
          <p>Ban chua chon san pham de booking.</p>
          <Link to="/cart" className="btn-primary inline-btn">
            Quay lai gio hang
          </Link>
        </div>
      ) : (
        <div className="page-grid booking-grid">
          <section className="stack">
            <article className="card">
              <h3>Thong tin lich thue</h3>

              <div className="field-row">
                <div>
                  <label htmlFor="start-date" className="label-text">
                    Ngay nhan do
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
                    Ngay tra do
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
                Ghi chu giao nhan
              </label>
              <textarea
                id="note"
                className="input textarea"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Vi du: giao gio hanh chinh tai nha"
              />
            </article>

            <article className="card stack compact-gap">
              {itemsWithAvailability.map((item) => (
                <div className="booking-item" key={`${item.productId}-${item.size}`}>
                  <div>
                    <h4>{item.name}</h4>
                    <p className="meta-text">
                      Size {item.size} x{item.quantity}
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
            <h3>Chi tiet booking</h3>
            <div className="summary-row">
              <span>So ngay thue</span>
              <span>{rentalDays} ngay</span>
            </div>
            <div className="summary-row">
              <span>Phi van chuyen</span>
              <span>{shippingFee === 0 ? "Mien phi" : formatCurrency(shippingFee)}</span>
            </div>
            <div className="summary-row">
              <span>Giam gia dai ngay</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
            <div className="summary-total">
              <span>Tong thanh toan</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            {unavailableItems.length > 0 ? (
              <p className="form-error">
                San pham trung lich: {unavailableItems.map((item) => item.name).join(", ")}
              </p>
            ) : null}

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button
              type="button"
              className="btn-primary"
              onClick={handleContinuePayment}
            >
              TIEP TUC THANH TOAN
            </button>
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
