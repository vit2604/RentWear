import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { apiUrl } from "../config/api";
import { formatCurrency } from "../utils/format";

const paymentMethods = [
  { id: "payos", name: "PayOS (QR/Chuyển khoản)", icon: "QR" },
  { id: "bank", name: "Chuyển khoản ngân hàng", icon: "BANK" },
  { id: "vnpay", name: "VNPay", icon: "VNPAY" },
  { id: "momo", name: "Ví MoMo", icon: "MOMO" },
  { id: "cod", name: "Tiền mặt khi nhận", icon: "COD" }
];

export default function Deposit() {
  const navigate = useNavigate();
  const { booking, placeOrder } = useAppContext();

  const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0].id);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingPayOS, setLoadingPayOS] = useState(false);
  const [payOSData, setPayOSData] = useState(null);

  const totalItems = useMemo(
    () => booking?.items?.reduce((total, item) => total + item.quantity, 0) || 0,
    [booking]
  );

  const handleConfirmPayOSDone = () => {
    const order = placeOrder({ paymentMethod: "payos" });

    if (!order) {
      setErrorMessage("Không tạo được đơn hàng sau bước thanh toán.");
      return;
    }

    navigate("/orders", { state: { orderId: order.id } });
  };

  const handleConfirmPayment = async () => {
    if (!booking) {
      setErrorMessage("Không tìm thấy thông tin đặt lịch.");
      return;
    }

    setErrorMessage("");

    if (selectedMethod === "payos") {
      try {
        setLoadingPayOS(true);
        setPayOSData(null);

        const response = await fetch(apiUrl("/payments/payos/create"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            amount: booking.total,
            description: `RENTWEAR-${Date.now().toString().slice(-6)}`
          })
        });

        const result = await response.json();

        if (!response.ok) {
          setErrorMessage(result?.message || "Không tạo được thanh toán PayOS.");
          return;
        }

        setPayOSData(result?.data || null);
        return;
      } catch (error) {
        setErrorMessage(`Lỗi kết nối PayOS: ${error.message || "Không rõ nguyên nhân."}`);
        return;
      } finally {
        setLoadingPayOS(false);
      }
    }

    const order = placeOrder({ paymentMethod: selectedMethod });

    if (!order) {
      setErrorMessage("Không tạo được đơn hàng. Vui lòng thử lại.");
      return;
    }

    if (["vnpay", "momo"].includes(selectedMethod)) {
      navigate("/payment-process", {
        state: {
          orderId: order.id,
          method: selectedMethod
        }
      });
      return;
    }

    if (selectedMethod === "bank") {
      alert("Chuyển khoản: STK 123456789 - BIDV");
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
                    <div className="flex items-center gap-2">
                      <span className="meta-text">{method.icon}</span>
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
                <span>{booking.shippingFee === 0 ? "Miễn phí" : formatCurrency(booking.shippingFee)}</span>
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

            {selectedMethod === "bank" ? (
              <article className="card">
                <h3>Thông tin chuyển khoản thủ công</h3>
                <div className="summary-row">
                  <span>Ngân hàng</span>
                  <span>BIDV</span>
                </div>
                <div className="summary-row">
                  <span>Số tài khoản</span>
                  <span>123456789</span>
                </div>
                <div className="summary-row">
                  <span>Chủ tài khoản</span>
                  <span>RentWear</span>
                </div>
                <div className="summary-row">
                  <span>Nội dung</span>
                  <span>RENTWEAR-{Date.now().toString().slice(-6)}</span>
                </div>
              </article>
            ) : null}

            {payOSData ? (
              <article className="card">
                <h3>Thông tin chuyển khoản PayOS</h3>
                <div className="summary-row">
                  <span>Ngân hàng (BIN)</span>
                  <span>{payOSData.bin || "--"}</span>
                </div>
                <div className="summary-row">
                  <span>Số tài khoản</span>
                  <span>{payOSData.accountNumber || "--"}</span>
                </div>
                <div className="summary-row">
                  <span>Chủ tài khoản</span>
                  <span>{payOSData.accountName || "--"}</span>
                </div>
                <div className="summary-row">
                  <span>Số tiền</span>
                  <span>{formatCurrency(payOSData.amount || booking.total)}</span>
                </div>
                <div className="summary-row">
                  <span>Nội dung</span>
                  <span>{payOSData.description || "--"}</span>
                </div>

                {payOSData.checkoutUrl ? (
                  <a className="btn-secondary !mt-2" href={payOSData.checkoutUrl} target="_blank" rel="noreferrer">
                    Mở trang thanh toán PayOS
                  </a>
                ) : null}

                <button type="button" className="btn-primary !mt-2" onClick={handleConfirmPayOSDone}>
                  Tôi đã thanh toán xong
                </button>
              </article>
            ) : null}
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
            {booking.customer ? (
              <>
                <div className="summary-row">
                  <span>Người nhận</span>
                  <span>{booking.customer.name || "--"}</span>
                </div>
                <div className="summary-row">
                  <span>Điện thoại</span>
                  <span>{booking.customer.phone || "--"}</span>
                </div>
                <div className="summary-row">
                  <span>Địa chỉ</span>
                  <span>{booking.customer.address || "--"}</span>
                </div>
              </>
            ) : null}
            <div className="summary-total">
              <span>Tổng cần thanh toán</span>
              <strong>{formatCurrency(booking.total)}</strong>
            </div>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button type="button" className="btn-primary" onClick={handleConfirmPayment} disabled={loadingPayOS}>
              {loadingPayOS ? "ĐANG TẠO THANH TOÁN..." : "XÁC NHẬN THANH TOÁN"}
            </button>
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
