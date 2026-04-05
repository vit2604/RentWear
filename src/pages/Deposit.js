import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { formatCurrency } from "../utils/format";

const paymentMethods = [
  { id: "bank", name: "Chuyển khoản ngân hàng" },
  { id: "wallet", name: "Ví điện tử" },
  { id: "cod", name: "Tiền mặt khi nhận" }
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
      setErrorMessage("Không tìm thấy thông tin đặt lịch.");
      return;
    }

    const order = placeOrder({ paymentMethod: selectedMethod });

    if (!order) {
      setErrorMessage("Không tạo được đơn hàng. Vui lòng thử lại.");
      return;
    }

    navigate("/orders", { state: { orderId: order.id } });
  };

  return (
    <MainLayout>
      <section className="section-heading section-heading-left">
        <h2>Thanh toán</h2>
        <p>Chọn phương thức thanh toán và xác nhận để hệ thống giữ lịch thuê.</p>
      </section>

      {!booking ? (
        <div className="card empty-state">
          <p>Bạn chưa có thông tin đặt lịch để thanh toán.</p>
          <Link to="/booking" className="btn-primary inline-btn">
            Quay lại đặt lịch
          </Link>
        </div>
      ) : (
        <div className="page-grid">
          <section className="stack">
            <article className="card">
              <h3>Phương thức thanh toán</h3>
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
              <h3>Chi tiết thanh toán</h3>
              <div className="summary-row">
                <span>Số lượng sản phẩm</span>
                <span>x{totalItems}</span>
              </div>
              <div className="summary-row">
                <span>Tổng tiền hàng</span>
                <span>{formatCurrency(booking.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển</span>
                <span>
                  {booking.shippingFee === 0
                    ? "Miễn phí"
                    : formatCurrency(booking.shippingFee)}
                </span>
              </div>
              <div className="summary-row">
                <span>Giảm giá</span>
                <span>-{formatCurrency(booking.discount)}</span>
              </div>
              <div className="summary-total">
                <span>Tổng</span>
                <strong>{formatCurrency(booking.total)}</strong>
              </div>
            </article>
          </section>

          <aside className="card summary-card">
            <h3>Xác nhận hóa đơn</h3>
            <div className="summary-row">
              <span>Thời gian thuê</span>
              <span>
                {booking.startDate} đến {booking.endDate}
              </span>
            </div>
            <div className="summary-row">
              <span>Số ngày</span>
              <span>{booking.days} ngày</span>
            </div>
            <div className="summary-total">
              <span>Tổng cần thanh toán</span>
              <strong>{formatCurrency(booking.total)}</strong>
            </div>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button type="button" className="btn-primary" onClick={handleConfirmPayment}>
              XÁC NHẬN THANH TOÁN
            </button>
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
