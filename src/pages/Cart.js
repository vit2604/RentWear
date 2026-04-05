import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { getProductById, getRealtimeStatus } from "../data/products";
import { formatCurrency } from "../utils/format";

export default function Cart() {
  const navigate = useNavigate();
  const {
    cart,
    products,
    getItemKey,
    removeCartItem,
    setCheckoutItems,
    updateCartItemQuantity
  } = useAppContext();

  const [selectedMap, setSelectedMap] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setSelectedMap((previous) => {
      const next = {};

      cart.forEach((item) => {
        const key = getItemKey(item);
        next[key] = previous[key] ?? true;
      });

      return next;
    });
  }, [cart, getItemKey]);

  const selectedItems = useMemo(
    () => cart.filter((item) => selectedMap[getItemKey(item)]),
    [cart, getItemKey, selectedMap]
  );

  const subtotal = useMemo(
    () =>
      selectedItems.reduce(
        (total, item) => total + item.pricePerDay * item.quantity,
        0
      ),
    [selectedItems]
  );

  const shippingFee = subtotal > 0 ? 0 : 0;
  const discount = subtotal >= 250000 ? 10000 : 0;
  const total = subtotal + shippingFee - discount;

  const toggleItem = (item) => {
    const key = getItemKey(item);
    setSelectedMap((previous) => ({
      ...previous,
      [key]: !previous[key]
    }));
  };

  const handleCheckout = () => {
    if (!selectedItems.length) {
      setErrorMessage("Bạn cần chọn ít nhất 1 sản phẩm để tiếp tục đặt lịch.");
      return;
    }

    setErrorMessage("");
    setCheckoutItems(selectedItems);
    navigate("/booking");
  };

  return (
    <MainLayout>
      <section className="section-heading section-heading-left">
        <h2>Giỏ hàng</h2>
        <p>Chỉnh sửa số lượng hoặc xóa bớt sản phẩm trước khi đặt lịch thuê.</p>
      </section>

      {cart.length === 0 ? (
        <div className="card empty-state">
          <p>Giỏ hàng đang trống.</p>
          <Link to="/product" className="btn-primary inline-btn">
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="page-grid">
          <section className="stack">
            {cart.map((item) => {
              const key = getItemKey(item);
              const product = getProductById(products, item.productId);
              const status = getRealtimeStatus(product);

              return (
                <article className="card cart-item" key={key}>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={Boolean(selectedMap[key])}
                    onChange={() => toggleItem(item)}
                  />

                  <img src={item.image} alt={item.name} className="cart-item-image" />

                  <div className="cart-item-main">
                    <div className="cart-item-head">
                      <h3>{item.name}</h3>
                      <span className={`status-chip ${status}`}>
                        {status === "available" ? "Sẵn hàng" : "Tạm hết"}
                      </span>
                    </div>
                    <p className="meta-text">
                      Cỡ {item.size} | Đơn giá {formatCurrency(item.pricePerDay)} / ngày
                    </p>
                  </div>

                  <div className="cart-item-actions">
                    <div className="qty-control">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItemQuantity(
                            item.productId,
                            item.size,
                            item.quantity - 1
                          )
                        }
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartItemQuantity(
                            item.productId,
                            item.size,
                            item.quantity + 1
                          )
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn-link danger"
                      onClick={() => removeCartItem(item.productId, item.size)}
                    >
                      Xóa
                    </button>
                  </div>
                </article>
              );
            })}

            <Link to="/product" className="continue-link">
              + Tiếp tục mua sắm
            </Link>
          </section>

          <aside className="card summary-card">
            <h3>Tạm tính ({selectedItems.length} sản phẩm)</h3>
            <div className="summary-row">
              <span>Phí giao hàng</span>
              <span>{shippingFee === 0 ? "Miễn phí" : formatCurrency(shippingFee)}</span>
            </div>
            <div className="summary-row">
              <span>Giảm giá</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
            <div className="summary-row">
              <span>Tạm tính tiền hàng</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-total">
              <span>Tổng tiền</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button type="button" className="btn-primary" onClick={handleCheckout}>
              ĐẶT NGAY
            </button>
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
