import { Link, useLocation } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { formatCurrency, formatDate } from "../utils/format";

const paymentLabel = {
  bank: "Chuyển khoản ngân hàng",
  wallet: "Ví điện tử",
  cod: "Tiền mặt khi nhận"
};

export default function Orders() {
  const location = useLocation();
  const { orders } = useAppContext();

  const highlightedOrderId = location.state?.orderId;

  if (!orders.length) {
    return (
      <MainLayout>
        <div className="card empty-state">
          <p>Bạn chưa có đơn thuê nào.</p>
          <Link to="/product" className="btn-primary inline-btn">
            Bắt đầu thuê đồ
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="section-heading section-heading-left">
        <h2>Xác nhận đơn hàng</h2>
        <p>Hệ thống đã ghi nhận thanh toán và đang chuẩn bị trang phục cho bạn.</p>
      </section>

      <div className="stack">
        {orders.map((order) => (
          <article
            className={`card order-card ${
              highlightedOrderId === order.id ? "order-highlighted" : ""
            }`}
            key={order.id}
          >
            <div className="order-head">
              <div>
                <h3>Mã đơn: {order.id}</h3>
                <p className="meta-text">Tạo lúc {formatDate(order.createdAt)}</p>
              </div>
              <span className="status-chip available">Đã xác nhận</span>
            </div>

            <div className="order-grid">
              <div>
                <p className="meta-text">
                  Thời gian thuê: {order.startDate} đến {order.endDate}
                </p>
                <p className="meta-text">
                  Phương thức: {paymentLabel[order.paymentMethod] || order.paymentMethod}
                </p>
              </div>
              <strong>{formatCurrency(order.total)}</strong>
            </div>

            <div className="order-items">
              {order.items.map((item) => (
                <div className="order-item" key={`${order.id}-${item.productId}-${item.size}`}>
                  <span>
                    {item.name} - Cỡ {item.size} x{item.quantity}
                  </span>
                  <span>{formatCurrency(item.pricePerDay * item.quantity)}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </MainLayout>
  );
}
