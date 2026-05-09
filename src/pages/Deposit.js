import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import FlowSteps from "../components/FlowSteps";
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

const resolvePayOSOrderId = (data) => {
  if (!data) return "";
  return String(data.orderCode || data.id || data.paymentLinkId || "").trim();
};

const buildQrImageUrl = (payOSData) => {
  const qrPayload = payOSData?.qrCode || payOSData?.checkoutUrl || "";
  if (!qrPayload) return "";

  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrPayload)}`;
};

export default function Deposit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking, placeOrder } = useAppContext();

  const [selectedMethod, setSelectedMethod] = useState(paymentMethods[0].id);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingPayOS, setLoadingPayOS] = useState(false);
  const [payOSData, setPayOSData] = useState(null);
  const [checkingPayOSStatus, setCheckingPayOSStatus] = useState(false);

  const methodsRef = useRef(null);
  const bankInfoRef = useRef(null);
  const payOSInfoRef = useRef(null);
  const payOSCompletedRef = useRef(false);
  const transferCodeRef = useRef(`RENTWEAR-${Date.now().toString().slice(-6)}`);

  const isCompactView = () => window.matchMedia("(max-width: 992px)").matches;

  const scrollToSection = (ref) => {
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const completePayOSOrder = useCallback(() => {
    if (payOSCompletedRef.current) {
      return;
    }

    payOSCompletedRef.current = true;

    const order = placeOrder({ paymentMethod: "payos" });

    if (!order) {
      setErrorMessage("Không tạo được đơn hàng sau khi xác nhận thanh toán PayOS.");
      payOSCompletedRef.current = false;
      return;
    }

    navigate("/orders", { state: { orderId: order.id } });
  }, [navigate, placeOrder]);

  useEffect(() => {
    if (location.state?.focus === "methods") {
      setTimeout(() => scrollToSection(methodsRef), 120);
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedMethod === "bank") {
      setTimeout(() => scrollToSection(bankInfoRef), 120);
    }

    if (selectedMethod !== "payos") {
      setPayOSData(null);
      setCheckingPayOSStatus(false);
      payOSCompletedRef.current = false;
    }
  }, [selectedMethod]);

  useEffect(() => {
    if (!payOSData) return;
    setTimeout(() => scrollToSection(payOSInfoRef), 120);
  }, [payOSData]);

  useEffect(() => {
    if (!booking || payOSCompletedRef.current) return;

    const params = new URLSearchParams(location.search);
    const status = String(params.get("status") || "").toUpperCase();
    const code = String(params.get("code") || "");
    const isCancel = String(params.get("cancel") || "").toLowerCase() === "true";

    if (!status && !code && !isCancel) return;

    if (status === "PAID" || (code === "00" && !isCancel)) {
      completePayOSOrder();
      return;
    }

    if (isCancel || status === "CANCELLED") {
      setErrorMessage("Bạn đã hủy thanh toán PayOS. Vui lòng thử lại khi sẵn sàng.");
    }
  }, [booking, completePayOSOrder, location.search]);

  useEffect(() => {
    if (!booking || selectedMethod !== "payos" || !payOSData || payOSCompletedRef.current) {
      return undefined;
    }

    const orderId = resolvePayOSOrderId(payOSData);
    if (!orderId) {
      return undefined;
    }

    let isUnmounted = false;

    const checkStatus = async () => {
      try {
        const response = await fetch(apiUrl(`/payments/payos/status/${encodeURIComponent(orderId)}`));
        const result = await response.json();

        if (!response.ok) {
          return;
        }

        const currentStatus = String(result?.data?.status || "").toUpperCase();

        if (currentStatus === "PAID") {
          if (!isUnmounted) {
            setCheckingPayOSStatus(false);
            completePayOSOrder();
          }
          return;
        }

        if (currentStatus === "CANCELLED") {
          if (!isUnmounted) {
            setCheckingPayOSStatus(false);
            setErrorMessage("Thanh toán PayOS đã bị hủy.");
          }
        }
      } catch (error) {
        // Bỏ qua lỗi mạng tạm thời để lần polling sau kiểm tra lại.
      }
    };

    setCheckingPayOSStatus(true);
    checkStatus();

    const timer = setInterval(checkStatus, 3000);

    return () => {
      isUnmounted = true;
      clearInterval(timer);
      setCheckingPayOSStatus(false);
    };
  }, [booking, completePayOSOrder, payOSData, selectedMethod]);

  const totalItems = useMemo(
    () => booking?.items?.reduce((total, item) => total + item.quantity, 0) || 0,
    [booking]
  );

  const handleConfirmPayment = async () => {
    if (!booking) {
      setErrorMessage("Không tìm thấy thông tin đặt lịch.");
      return;
    }

    setErrorMessage("");

    if (isCompactView()) {
      scrollToSection(methodsRef);
    }

    if (selectedMethod === "payos") {
      try {
        setLoadingPayOS(true);
        setPayOSData(null);
        payOSCompletedRef.current = false;

        const response = await fetch(apiUrl("/payments/payos/create"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            amount: booking.total,
            description: transferCodeRef.current
          })
        });

        const result = await response.json();

        if (!response.ok) {
          setErrorMessage(result?.message || "Không tạo được thanh toán PayOS.");
          return;
        }

        if (!result?.data) {
          setErrorMessage("PayOS chưa trả về dữ liệu thanh toán.");
          return;
        }

        setPayOSData(result.data);
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

      <FlowSteps current="payment" />

      {!booking ? (
        <div className="card empty-state">
          <p>Bạn chưa có thông tin đặt lịch để thanh toán.</p>
          <Link to="/booking" className="btn-primary inline-btn">
            Quay lại đặt lịch
          </Link>
        </div>
      ) : (
        <div className="page-grid has-mobile-sticky">
          <section className="stack">
            <article ref={methodsRef} className="card scroll-anchor">
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

            <article className="card scroll-anchor">
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
              <article ref={bankInfoRef} className="card scroll-anchor">
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
                  <span>{transferCodeRef.current}</span>
                </div>
              </article>
            ) : null}

            {selectedMethod === "payos" && payOSData ? (
              <article ref={payOSInfoRef} className="card scroll-anchor">
                <h3>Mã QR thanh toán PayOS</h3>
                <p className="meta-text">Quét mã bằng app ngân hàng để thanh toán ngay.</p>

                {buildQrImageUrl(payOSData) ? (
                  <div className="mb-3 flex justify-center">
                    <img
                      src={buildQrImageUrl(payOSData)}
                      alt="QR thanh toán PayOS"
                      className="h-[220px] w-[220px] rounded-xl border border-line bg-white p-2"
                    />
                  </div>
                ) : null}

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
                  <span>{payOSData.description || transferCodeRef.current}</span>
                </div>

                {payOSData.checkoutUrl ? (
                  <a className="btn-secondary !mt-2" href={payOSData.checkoutUrl} target="_blank" rel="noreferrer">
                    Mở trang thanh toán PayOS
                  </a>
                ) : null}

                <p className="meta-text !mt-2">
                  {checkingPayOSStatus
                    ? "Hệ thống đang tự kiểm tra trạng thái thanh toán..."
                    : "Hệ thống sẽ tự chuyển sang đã xác nhận ngay khi PayOS báo PAID."}
                </p>
              </article>
            ) : null}
          </section>

          <aside className="card summary-card scroll-anchor">
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
              {loadingPayOS
                ? "ĐANG TẠO THANH TOÁN..."
                : selectedMethod === "payos"
                  ? "THANH TOÁN PAYOS"
                  : "XÁC NHẬN THANH TOÁN"}
            </button>
          </aside>

          <div className="mobile-sticky-action" role="region" aria-label="Tóm tắt thanh toán">
            <div className="mobile-sticky-action-row">
              <div className="mobile-sticky-meta">
                <span className="mobile-sticky-label">Cần thanh toán</span>
                <strong className="mobile-sticky-value">{formatCurrency(booking.total)}</strong>
              </div>
              <button
                type="button"
                className="btn-primary mobile-sticky-button"
                onClick={handleConfirmPayment}
                disabled={loadingPayOS}
              >
                {loadingPayOS ? "Đang xử lý" : selectedMethod === "payos" ? "Thanh toán" : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
