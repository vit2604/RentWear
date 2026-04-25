import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";

export default function PaymentProcess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateOrderStatus } = useAppContext();

  const orderId = location.state?.orderId;
  const method = location.state?.method || "online";

  useEffect(() => {
    if (!orderId) {
      navigate("/orders", { replace: true });
      return undefined;
    }

    const timer = setTimeout(() => {
      const isSuccess = Math.random() > 0.2;
      updateOrderStatus(orderId, isSuccess ? "paid" : "failed");
      navigate("/orders", { state: { orderId } });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, orderId, updateOrderStatus]);

  return (
    <MainLayout>
      <div className="card empty-state">
        <h3>Đang xử lý thanh toán {method.toUpperCase()}...</h3>
        <p>Hệ thống đang xác nhận giao dịch, vui lòng đợi trong giây lát.</p>
      </div>
    </MainLayout>
  );
}
