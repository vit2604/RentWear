import { Link, useLocation } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { formatCurrency, formatDate } from "../utils/format";

const paymentLabel = {
  payos: "PayOS (QR/chuyen khoan)",
  bank: "Chuyen khoan ngan hang",
  vnpay: "VNPay",
  momo: "Vi MoMo",
  wallet: "Vi dien tu",
  cod: "Tien mat khi nhan"
};

const paymentStatusLabel = {
  pending: "Dang cho xu ly",
  paid: "Da thanh toan",
  failed: "That bai"
};

export default function Orders() {
  const location = useLocation();
  const { orders } = useAppContext();

  const highlightedOrderId = location.state?.orderId;

  if (!orders.length) {
    return (
      <MainLayout>
        <div className="card empty-state">
          <p>Ban chua co don thue nao.</p>
          <Link to="/product" className="btn-primary inline-btn">
            Bat dau thue do
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className="section-heading section-heading-left">
        <h2>Xac nhan don hang</h2>
        <p>He thong da ghi nhan thanh toan va dang chuan bi trang phuc cho ban.</p>
      </section>

      <div className="stack">
        {orders.map((order) => (
          <article
            className={`card order-card ${highlightedOrderId === order.id ? "order-highlighted" : ""}`}
            key={order.id}
          >
            <div className="order-head">
              <div>
                <h3>Ma don: {order.id}</h3>
                <p className="meta-text">Tao luc {formatDate(order.createdAt)}</p>
              </div>
              <span className="status-chip available">Da xac nhan</span>
            </div>

            <div className="order-grid">
              <div>
                <p className="meta-text">
                  Thoi gian thue: {order.startDate} den {order.endDate}
                </p>
                <p className="meta-text">
                  Phuong thuc: {paymentLabel[order.paymentMethod] || order.paymentMethod}
                </p>
                <p className="meta-text">
                  Thanh toan: {paymentStatusLabel[order.paymentStatus] || order.paymentStatus || "Da thanh toan"}
                </p>
              </div>
              <strong>{formatCurrency(order.total)}</strong>
            </div>

            <div className="order-items">
              {order.items.map((item) => (
                <div className="order-item" key={`${order.id}-${item.productId}-${item.size}`}>
                  <span>
                    {item.name} - Co {item.size} x{item.quantity}
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
