import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { apiUrl } from "../config/api";
import { formatCurrency } from "../utils/format";

const paymentMethods = [
  { id: "payos", name: "PayOS (QR/Chuyen khoan)", icon: "QR" },
  { id: "bank", name: "Chuyen khoan ngan hang", icon: "BANK" },
  { id: "vnpay", name: "VNPay", icon: "VNPAY" },
  { id: "momo", name: "Vi MoMo", icon: "MOMO" },
  { id: "cod", name: "Tien mat khi nhan", icon: "COD" }
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
      setErrorMessage("Khong tao duoc don hang sau buoc thanh toan.");
      return;
    }

    navigate("/orders", { state: { orderId: order.id } });
  };

  const handleConfirmPayment = async () => {
    if (!booking) {
      setErrorMessage("Khong tim thay thong tin dat lich.");
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
          setErrorMessage(result?.message || "Khong tao duoc thanh toan PayOS.");
          return;
        }

        setPayOSData(result?.data || null);
        return;
      } catch (error) {
        setErrorMessage(`Loi ket noi PayOS: ${error.message || "Khong ro nguyen nhan."}`);
        return;
      } finally {
        setLoadingPayOS(false);
      }
    }

    const order = placeOrder({ paymentMethod: selectedMethod });

    if (!order) {
      setErrorMessage("Khong tao duoc don hang. Vui long thu lai.");
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
      alert("Chuyen khoan: STK 123456789 - BIDV");
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
          <p>Ban chua co thong tin dat lich de thanh toan.</p>
          <Link to="/booking" className="btn-primary inline-btn">
            Quay lai dat lich
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
                <span>{booking.shippingFee === 0 ? "Mien phi" : formatCurrency(booking.shippingFee)}</span>
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

            {selectedMethod === "bank" ? (
              <article className="card">
                <h3>Thong tin chuyen khoan thu cong</h3>
                <div className="summary-row">
                  <span>Ngan hang</span>
                  <span>BIDV</span>
                </div>
                <div className="summary-row">
                  <span>So tai khoan</span>
                  <span>123456789</span>
                </div>
                <div className="summary-row">
                  <span>Chu tai khoan</span>
                  <span>RentWear</span>
                </div>
                <div className="summary-row">
                  <span>Noi dung</span>
                  <span>RENTWEAR-{Date.now().toString().slice(-6)}</span>
                </div>
              </article>
            ) : null}

            {payOSData ? (
              <article className="card">
                <h3>Thong tin chuyen khoan PayOS</h3>
                <div className="summary-row">
                  <span>Ngan hang (BIN)</span>
                  <span>{payOSData.bin || "--"}</span>
                </div>
                <div className="summary-row">
                  <span>So tai khoan</span>
                  <span>{payOSData.accountNumber || "--"}</span>
                </div>
                <div className="summary-row">
                  <span>Chu tai khoan</span>
                  <span>{payOSData.accountName || "--"}</span>
                </div>
                <div className="summary-row">
                  <span>So tien</span>
                  <span>{formatCurrency(payOSData.amount || booking.total)}</span>
                </div>
                <div className="summary-row">
                  <span>Noi dung</span>
                  <span>{payOSData.description || "--"}</span>
                </div>

                {payOSData.checkoutUrl ? (
                  <a className="btn-secondary !mt-2" href={payOSData.checkoutUrl} target="_blank" rel="noreferrer">
                    Mo trang thanh toan PayOS
                  </a>
                ) : null}

                <button type="button" className="btn-primary !mt-2" onClick={handleConfirmPayOSDone}>
                  Toi da thanh toan xong
                </button>
              </article>
            ) : null}
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
            {booking.customer ? (
              <>
                <div className="summary-row">
                  <span>Nguoi nhan</span>
                  <span>{booking.customer.name || "--"}</span>
                </div>
                <div className="summary-row">
                  <span>Dien thoai</span>
                  <span>{booking.customer.phone || "--"}</span>
                </div>
                <div className="summary-row">
                  <span>Dia chi</span>
                  <span>{booking.customer.address || "--"}</span>
                </div>
              </>
            ) : null}
            <div className="summary-total">
              <span>Tong can thanh toan</span>
              <strong>{formatCurrency(booking.total)}</strong>
            </div>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button type="button" className="btn-primary" onClick={handleConfirmPayment} disabled={loadingPayOS}>
              {loadingPayOS ? "DANG TAO THANH TOAN..." : "XAC NHAN THANH TOAN"}
            </button>
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
