import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { getProductById, getRealtimeStatus, isDateRangeAvailable } from "../data/products";
import { formatCurrency, getRentalDays } from "../utils/format";

const statusLabels = {
  available: "Sẵn hàng",
  unavailable: "Tạm hết"
};

const getInitialDates = () => {
  const now = new Date();
  const start = now.toISOString().split("T")[0];
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 1);

  return {
    start,
    end: endDate.toISOString().split("T")[0]
  };
};

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart, products, setBooking, setCheckoutItems } = useAppContext();

  const product = getProductById(products, id);
  const dates = getInitialDates();

  const [size, setSize] = useState(product?.defaultSize || "M");
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(dates.start);
  const [endDate, setEndDate] = useState(dates.end);
  const [errorMessage, setErrorMessage] = useState("");

  const rentalDays = useMemo(() => getRentalDays(startDate, endDate), [startDate, endDate]);

  if (!product) {
    return (
      <MainLayout>
        <div className="card empty-state">
          <p>Không tìm thấy sản phẩm.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate("/product")}>
            Quay lại danh sách
          </button>
        </div>
      </MainLayout>
    );
  }

  const isAvailable = isDateRangeAvailable(product, startDate, endDate);
  const subtotal = product.pricePerDay * quantity * Math.max(1, rentalDays);

  const createItemPayload = () => ({
    productId: product.id,
    name: product.name,
    image: product.image,
    pricePerDay: product.pricePerDay,
    size,
    quantity
  });

  const handleAddToCart = () => {
    addToCart(product, size);
    setErrorMessage("");
  };

  const handleRentNow = () => {
    if (rentalDays <= 0) {
      setErrorMessage("Ngày thuê không hợp lệ.");
      return;
    }

    if (!isAvailable) {
      setErrorMessage("Sản phẩm đang trùng lịch cho khoảng ngày đã chọn.");
      return;
    }

    const item = createItemPayload();
    setCheckoutItems([item]);
    setBooking({
      startDate,
      endDate,
      note: "",
      days: rentalDays,
      items: [item],
      subtotal,
      shippingFee: 0,
      discount: rentalDays >= 5 ? Math.round(subtotal * 0.05) : 0,
      total: subtotal - (rentalDays >= 5 ? Math.round(subtotal * 0.05) : 0)
    });

    navigate("/payment");
  };

  return (
    <MainLayout>
      <div className="stack">
        <button type="button" className="btn-link" onClick={() => navigate("/product")}>
          ← Quay lại sản phẩm
        </button>

        <section className="card">
          <div className="product-layout !grid-cols-[320px_1fr] !items-start">
            <img src={product.image} alt={product.name} className="product-image !h-[420px] rounded-[12px]" />

            <div className="stack">
              <div>
                <p className="product-category">{product.category}</p>
                <h2 className="m-0 font-display text-[2rem]">{product.name}</h2>
                <p className="meta-text">{product.description}</p>
              </div>

              <div className="product-detail-row">
                <span>Giá thuê theo ngày</span>
                <strong>{formatCurrency(product.pricePerDay)}</strong>
              </div>
              <div className="product-detail-row">
                <span>Tình trạng hiện tại</span>
                <strong>{statusLabels[getRealtimeStatus(product)]}</strong>
              </div>
              <div className="product-detail-row">
                <span>Khả dụng theo ngày đã chọn</span>
                <strong>{isAvailable ? "Còn lịch" : "Trùng lịch"}</strong>
              </div>

              <div className="field-row">
                <div>
                  <label htmlFor="start-date" className="label-text">
                    Ngày nhận đồ
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    className="input"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="end-date" className="label-text">
                    Ngày trả đồ
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    className="input"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="field-row">
                <div>
                  <label htmlFor="size-select" className="label-text">
                    Chọn cỡ
                  </label>
                  <select
                    id="size-select"
                    className="input"
                    value={size}
                    onChange={(event) => setSize(event.target.value)}
                  >
                    {product.sizeOptions.map((itemSize) => (
                      <option key={itemSize} value={itemSize}>
                        Cỡ {itemSize}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="qty-select" className="label-text">
                    Số lượng
                  </label>
                  <input
                    id="qty-select"
                    type="number"
                    min={1}
                    max={Math.max(1, product.stock - product.rented)}
                    className="input"
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  />
                </div>
              </div>

              <div className="summary-total !border-b !border-[#ece5d9] !pt-0">
                <span>Tạm tính ({Math.max(1, rentalDays)} ngày)</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>

              {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

              <div className="button-row">
                <button type="button" className="btn-secondary" onClick={handleAddToCart}>
                  Thêm vào giỏ
                </button>
                <button type="button" className="btn-primary" onClick={handleRentNow}>
                  Thuê ngay
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
