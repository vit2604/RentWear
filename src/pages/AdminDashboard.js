import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { getRealtimeStatus } from "../data/products";
import { formatCurrency, formatDate } from "../utils/format";

const paymentLabel = {
  bank: "Chuyển khoản ngân hàng",
  wallet: "Ví điện tử",
  cod: "Tiền mặt khi nhận"
};

const getShortLabel = (value = "") => {
  const text = value.trim();

  if (text.length <= 10) {
    return text;
  }

  return `${text.slice(0, 9)}...`;
};

const isSameDate = (firstDate, secondDate) => {
  const first = new Date(firstDate);
  const second = new Date(secondDate);

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
};

function MetricBarChart({ labels, series, color = "#a87741" }) {
  const maxValue = Math.max(...series, 1);

  return (
    <div className="rounded-xl border border-line bg-[#fbf8f2] p-4">
      <div className="flex h-56 items-stretch gap-2 rounded-lg border border-dashed border-[#e3dbc9] bg-white px-2 pb-2 pt-3">
        {series.map((value, index) => {
          const height = `${Math.max(6, (value / maxValue) * 100)}%`;

          return (
            <div
              className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1"
              key={`${labels[index]}-${index}`}
            >
              <div className="relative flex-1">
                <div
                  className="absolute bottom-0 w-full rounded-t-md transition-all duration-500"
                  style={{
                    height,
                    minHeight: "6px",
                    backgroundColor: color
                  }}
                  title={`${labels[index]}: ${value}`}
                />
              </div>
              <span className="truncate text-center text-[10px] text-muted">
                {labels[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { booking, cart, orders, products, user } = useAppContext();

  const totalStock = useMemo(
    () => products.reduce((total, product) => total + product.stock, 0),
    [products]
  );

  const rentingNow = useMemo(
    () => products.reduce((total, product) => total + product.rented, 0),
    [products]
  );

  const availableProducts = useMemo(
    () =>
      products.filter((product) => getRealtimeStatus(product) === "available")
        .length,
    [products]
  );

  const grossRevenue = useMemo(
    () => orders.reduce((total, order) => total + (order.total || 0), 0),
    [orders]
  );

  const todayOrderCount = useMemo(
    () => orders.filter((order) => isSameDate(order.createdAt, new Date())).length,
    [orders]
  );

  const timeline = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - (6 - index));
        return day;
      }),
    []
  );

  const timelineLabels = useMemo(
    () =>
      timeline.map((day) =>
        new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(day)
      ),
    [timeline]
  );

  const orderSeries = useMemo(
    () =>
      timeline.map((day) =>
        orders.filter((order) => isSameDate(order.createdAt, day)).length
      ),
    [orders, timeline]
  );

  const revenueSeries = useMemo(
    () =>
      timeline.map((day) =>
        orders
          .filter((order) => isSameDate(order.createdAt, day))
          .reduce((total, order) => total + (order.total || 0), 0)
      ),
    [orders, timeline]
  );

  const stockLabels = products.slice(0, 8).map((product) => getShortLabel(product.name));
  const stockSeries = products.slice(0, 8).map((product) => product.stock);

  const utilizationSeries = products
    .slice(0, 8)
    .map((product) => Math.round((product.rented / Math.max(product.stock, 1)) * 100));

  const metrics = useMemo(
    () => [
      {
        id: "products",
        title: "Tổng sản phẩm",
        value: `${products.length} mẫu`,
        subtitle: `${availableProducts} mẫu đang sẵn hàng`,
        chartTitle: "Phân bổ tồn kho theo sản phẩm",
        labels: stockLabels,
        series: stockSeries.length ? stockSeries : [0],
        chartColor: "#a87741",
        details: [
          `Số mẫu đang kinh doanh: ${products.length}`,
          `Sản phẩm sẵn hàng: ${availableProducts}`,
          `Sản phẩm tạm hết: ${Math.max(products.length - availableProducts, 0)}`
        ],
        suggestion:
          "Gợi ý: ưu tiên đẩy hiển thị các mẫu có tồn kho cao để tăng tỷ lệ chuyển đổi."
      },
      {
        id: "stock",
        title: "Tồn kho & công suất",
        value: `${rentingNow}/${totalStock}`,
        subtitle: "Số lượng đang thuê trên tổng tồn kho",
        chartTitle: "Biểu đồ công suất cho thuê (%)",
        labels: stockLabels,
        series: utilizationSeries.length ? utilizationSeries : [0],
        chartColor: "#4a8f6d",
        details: [
          `Công suất trung bình: ${
            utilizationSeries.length
              ? Math.round(
                  utilizationSeries.reduce((sum, item) => sum + item, 0) /
                    utilizationSeries.length
                )
              : 0
          }%`,
          `Sản phẩm đang cho thuê: ${rentingNow}`,
          `Sức chứa còn lại: ${Math.max(totalStock - rentingNow, 0)}`
        ],
        suggestion:
          "Gợi ý: nếu công suất vượt 80%, nên chuẩn bị thêm size bán chạy để tránh hụt lịch."
      },
      {
        id: "orders",
        title: "Tổng đơn đã tạo",
        value: `${orders.length} đơn`,
        subtitle: `${todayOrderCount} đơn phát sinh hôm nay`,
        chartTitle: "Xu hướng đơn hàng 7 ngày gần nhất",
        labels: timelineLabels,
        series: orderSeries,
        chartColor: "#7e5b9c",
        details: [
          `Đơn hôm nay: ${todayOrderCount}`,
          `Đơn cao nhất 7 ngày: ${Math.max(...orderSeries, 0)}`,
          `Đơn thấp nhất 7 ngày: ${Math.min(...orderSeries, 0)}`
        ],
        suggestion:
          "Gợi ý: theo dõi ngày có đỉnh đơn để chuẩn hóa ca giao nhận và đội vận hành."
      },
      {
        id: "revenue",
        title: "Doanh thu tạm tính",
        value: formatCurrency(grossRevenue),
        subtitle: "Tổng giá trị đơn hàng đã xác nhận",
        chartTitle: "Dòng tiền theo thời gian (7 ngày)",
        labels: timelineLabels,
        series: revenueSeries,
        chartColor: "#c04d4d",
        details: [
          `Doanh thu 7 ngày: ${formatCurrency(revenueSeries.reduce((s, i) => s + i, 0))}`,
          `Ngày cao nhất: ${formatCurrency(Math.max(...revenueSeries, 0))}`,
          `Doanh thu trung bình/ngày: ${formatCurrency(
            Math.round(revenueSeries.reduce((s, i) => s + i, 0) / 7)
          )}`
        ],
        suggestion:
          "Gợi ý: tạo combo thuê theo tuần để tăng doanh thu đều trong các ngày thấp điểm."
      }
    ],
    [
      availableProducts,
      grossRevenue,
      orderSeries,
      orders.length,
      products.length,
      rentingNow,
      revenueSeries,
      stockLabels,
      stockSeries,
      timelineLabels,
      todayOrderCount,
      totalStock,
      utilizationSeries
    ]
  );

  const [activeMetricId, setActiveMetricId] = useState(metrics[0]?.id || "products");

  useEffect(() => {
    if (!metrics.some((metric) => metric.id === activeMetricId)) {
      setActiveMetricId(metrics[0]?.id || "products");
    }
  }, [activeMetricId, metrics]);

  const activeMetric =
    metrics.find((metric) => metric.id === activeMetricId) || metrics[0];

  const pendingBookingItems = booking?.items?.length || 0;
  const unavailableProducts = Math.max(products.length - availableProducts, 0);
  const recentOrders = orders.slice(0, 6);

  return (
    <MainLayout>
      <section className="section-heading section-heading-left">
        <h2>Bảng điều khiển quản trị</h2>
        <p>
          Theo dõi vận hành theo thời gian thực. Di chuột để xem thẻ nổi, bấm vào
          từng ô để xem biểu đồ chi tiết.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <aside className="space-y-3">
          {metrics.map((metric) => {
            const isActive = activeMetricId === metric.id;

            return (
              <button
                type="button"
                key={metric.id}
                onClick={() => setActiveMetricId(metric.id)}
                className={`card w-full text-left transition ${
                  isActive
                    ? "border-brand shadow-soft"
                    : "hover:-translate-y-1 hover:border-[#d6c7ad] hover:shadow"
                }`}
              >
                <p className="meta-text">{metric.title}</p>
                <h3 className="mt-2 text-2xl font-semibold">{metric.value}</h3>
                <p className="meta-text">{metric.subtitle}</p>
              </button>
            );
          })}

          <article className="card">
            <h3 className="mb-3 text-lg font-semibold">Cảnh báo vận hành</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                Booking đang mở: <strong className="text-ink">{pendingBookingItems}</strong>
              </li>
              <li>
                Sản phẩm tạm hết: <strong className="text-ink">{unavailableProducts}</strong>
              </li>
              <li>
                Sản phẩm trong giỏ hiện tại: <strong className="text-ink">{cart.length}</strong>
              </li>
              <li>
                Admin đăng nhập: <strong className="text-ink">{user?.email || "--"}</strong>
              </li>
            </ul>
          </article>
        </aside>

        <article className="card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="m-0 text-2xl font-semibold">{activeMetric.title}</h3>
              <p className="mt-1 text-sm text-muted">{activeMetric.chartTitle}</p>
            </div>
            <div className="rounded-lg bg-[#f3eadc] px-3 py-2 text-right">
              <p className="m-0 text-xs uppercase tracking-wide text-muted">Giá trị hiện tại</p>
              <strong className="text-lg text-brand">{activeMetric.value}</strong>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <MetricBarChart
              labels={activeMetric.labels}
              series={activeMetric.series}
              color={activeMetric.chartColor}
            />

            <div className="rounded-xl border border-line bg-[#fbf8f2] p-4">
              <h4 className="mb-2 mt-0 text-base font-semibold">Thông số phân tích</h4>
              <ul className="space-y-2 text-sm text-muted">
                {activeMetric.details.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 rounded-lg bg-white p-3 text-sm text-[#6f5a3f]">
                {activeMetric.suggestion}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Link className="btn-secondary" to="/product">
              Mở tab Sản phẩm
            </Link>
            <Link className="btn-secondary" to="/orders">
              Xem danh sách đơn hàng
            </Link>
            <Link className="btn-secondary" to="/profile">
              Cập nhật hồ sơ admin
            </Link>
          </div>
        </article>
      </section>

      <section className="card mt-4 overflow-hidden">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Đơn hàng gần đây</h3>
          <span className="meta-text">{recentOrders.length} đơn mới nhất</span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state !py-8">
            <p>Chưa có đơn hàng nào để hiển thị.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="py-2 pr-4 font-semibold">Mã đơn</th>
                  <th className="py-2 pr-4 font-semibold">Ngày tạo</th>
                  <th className="py-2 pr-4 font-semibold">Thanh toán</th>
                  <th className="py-2 pr-4 font-semibold">Số SP</th>
                  <th className="py-2 text-right font-semibold">Tổng tiền</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-[#f0eadf]">
                    <td className="py-2 pr-4">{order.id}</td>
                    <td className="py-2 pr-4">{formatDate(order.createdAt)}</td>
                    <td className="py-2 pr-4">
                      {paymentLabel[order.paymentMethod] || order.paymentMethod}
                    </td>
                    <td className="py-2 pr-4">{order.items?.length || 0}</td>
                    <td className="py-2 text-right font-semibold text-brand">
                      {formatCurrency(order.total || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </MainLayout>
  );
}
