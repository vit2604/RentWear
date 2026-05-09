const flowItems = [
  { key: "cart", label: "Giỏ hàng" },
  { key: "booking", label: "Đặt lịch" },
  { key: "payment", label: "Thanh toán" },
  { key: "done", label: "Xác nhận" }
];

export default function FlowSteps({ current = "cart" }) {
  const currentIndex = Math.max(
    0,
    flowItems.findIndex((item) => item.key === current)
  );

  return (
    <ol className="flow-steps" aria-label="Tiến trình đặt thuê">
      {flowItems.map((item, index) => {
        const stateClass =
          index < currentIndex
            ? "is-complete"
            : index === currentIndex
              ? "is-current"
              : "is-upcoming";

        return (
          <li key={item.key} className={`flow-step ${stateClass}`}>
            <span className="flow-step-dot">{index + 1}</span>
            <span className="flow-step-label">{item.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

