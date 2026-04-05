import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { formatCurrency } from "../utils/format";

const paymentMethods = [
  { id: "bank", name: "Chuyen khoan ngan hang" },
  { id: "wallet", name: "Vi dien tu" },
  { id: "cod", name: "Tien mat khi nhan" }
];

export default function Deposit() {
  const navigate = useNavigate();
  const { booking, placeOrder } = useAppContext();
  const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0].id);
  const [errorMessage, setErrorMessage] = useState("");

  const totalItems = useMemo(
    () =>
      booking?.items?.reduce((total, item) => total + item.quantity, 0) || 0,
    [booking]
  );

  const handleConfirmPayment = () => {
    if (!booking) {
      setErrorMessage("Khong tim thay thong tin booking.");
      return;
    }

    const order = placeOrder({ paymentMethod: selectedMethod });

    if (!order) {
      setErrorMessage("Khong tao duoc don hang. Vui long thu lai.");
      return;
    }

    navigate("/orders", { state: { orderId: order.id } });
  };

  return (
    <MainLayout>
      <section className="section-heading section-heading-left">
        <h2>Thanh toan</h2>
        <p>Chon phuong thuc thanh toan va xac nhan de he thong giu lich thue.</p>
      </section>

      {!booking ? (
        <div className="card empty-state">
          <p>Ban chua co thong tin booking de thanh toan.</p>
          <Link to="/booking" className="btn-primary inline-btn">
            Quay lai booking
          </Link>
        </div>
      ) : (
        <div className="page-grid">
          <section className="stack">
            <article className="card">
              <h3>Phuong thuc thanh toan</h3>
              <div className="payment-methods">
                {paymentMethods.map((method) => (
                  <label className="payment-option" key={method.id}>
                    <div>
                      <strong>{method.name}</strong>
                    </div>
                    <input
                      type="radio"
                      name="payment-method"
                      checked={selectedMethod === method.id}
                      onChange={() => setSelectedMethod(method.id)}
                    />
                  </label>
                ))}
              </div>
            </article>

            <article className="card">
              <h3>Chi tiet thanh toan</h3>
              <div className="summary-row">
                <span>So luong san pham</span>
                <span>x{totalItems}</span>
              </div>
              <div className="summary-row">
                <span>Tong tien hang</span>
                <span>{formatCurrency(booking.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Phi van chuyen</span>
                <span>
                  {booking.shippingFee === 0
                    ? "Mien phi"
                    : formatCurrency(booking.shippingFee)}
                </span>
              </div>
              <div className="summary-row">
                <span>Giam gia</span>
                <span>-{formatCurrency(booking.discount)}</span>
              </div>
              <div className="summary-total">
                <span>Tong</span>
                <strong>{formatCurrency(booking.total)}</strong>
              </div>
            </article>
          </section>

          <aside className="card summary-card">
            <h3>Xac nhan hoa don</h3>
            <div className="summary-row">
              <span>Thoi gian thue</span>
              <span>
                {booking.startDate} den {booking.endDate}
              </span>
            </div>
            <div className="summary-row">
              <span>So ngay</span>
              <span>{booking.days} ngay</span>
            </div>
            <div className="summary-total">
              <span>Tong can thanh toan</span>
              <strong>{formatCurrency(booking.total)}</strong>
            </div>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button type="button" className="btn-primary" onClick={handleConfirmPayment}>
              XAC NHAN THANH TOAN
            </button>
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
