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
      setErrorMessage("Ban can chon it nhat 1 san pham de tiep tuc booking.");
      return;
    }

    setErrorMessage("");
    setCheckoutItems(selectedItems);
    navigate("/booking");
  };

  return (
    <MainLayout>
      <section className="section-heading section-heading-left">
        <h2>Gio hang</h2>
        <p>Chinh sua so luong hoac xoa bot san pham truoc khi dat lich thue.</p>
      </section>

      {cart.length === 0 ? (
        <div className="card empty-state">
          <p>Gio hang dang trong.</p>
          <Link to="/product" className="btn-primary inline-btn">
            Kham pha san pham
          </Link>
        </div>
      ) : (
        <div className="page-grid">
          <section className="stack">
            {cart.map((item) => {
              const key = getItemKey(item);
              const product = getProductById(item.productId);
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
                        {status === "available" ? "San hang" : "Tam het"}
                      </span>
                    </div>
                    <p className="meta-text">
                      Size {item.size} | Don gia {formatCurrency(item.pricePerDay)} / ngay
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
                      Xoa
                    </button>
                  </div>
                </article>
              );
            })}

            <Link to="/product" className="continue-link">
              + Tiep tuc mua sam
            </Link>
          </section>

          <aside className="card summary-card">
            <h3>Tam tinh ({selectedItems.length} san pham)</h3>
            <div className="summary-row">
              <span>Phi giao hang</span>
              <span>{shippingFee === 0 ? "Mien phi" : formatCurrency(shippingFee)}</span>
            </div>
            <div className="summary-row">
              <span>Giam gia</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
            <div className="summary-row">
              <span>Tam tinh tien hang</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-total">
              <span>Tong tien</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

            <button type="button" className="btn-primary" onClick={handleCheckout}>
              DAT NGAY
            </button>
          </aside>
        </div>
      )}
    </MainLayout>
  );
}
