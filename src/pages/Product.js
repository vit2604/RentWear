import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import {
  getRealtimeStatus,
  isDateRangeAvailable,
  products
} from "../data/products";
import { formatCurrency } from "../utils/format";

const statusLabels = {
  available: "San hang",
  unavailable: "Tam het"
};

export default function Product() {
  const navigate = useNavigate();
  const { addToCart } = useAppContext();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const [sizeSelection, setSizeSelection] = useState({});

  const categories = useMemo(
    () => ["all", ...new Set(products.map((product) => product.category))],
    []
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const statusValue = getRealtimeStatus(product);
      const matchesQuery =
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || product.category === category;
      const matchesStatus = status === "all" || statusValue === status;

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [category, query, status]);

  useEffect(() => {
    if (!filteredProducts.length) {
      setSelectedProduct(null);
      return;
    }

    if (!selectedProduct) {
      setSelectedProduct(filteredProducts[0]);
      return;
    }

    const selectedStillVisible = filteredProducts.some(
      (product) => product.id === selectedProduct.id
    );

    if (!selectedStillVisible) {
      setSelectedProduct(filteredProducts[0]);
    }
  }, [filteredProducts, selectedProduct]);

  const handleAddToCart = (product) => {
    const size = sizeSelection[product.id] || product.defaultSize;
    addToCart(product, size);
  };

  return (
    <MainLayout>
      <section className="section-heading section-heading-left">
        <h2>Danh sach san pham</h2>
        <p>Tim kiem theo ten, danh muc va tinh trang cho thue.</p>
      </section>

      <div className="product-layout">
        <aside className="card filter-card">
          <h3>Bo loc</h3>

          <label htmlFor="search" className="label-text">
            Tim kiem
          </label>
          <input
            id="search"
            type="text"
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nhap ten san pham"
          />

          <label htmlFor="category" className="label-text">
            Danh muc
          </label>
          <select
            id="category"
            className="input"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Tat ca" : item}
              </option>
            ))}
          </select>

          <label htmlFor="status" className="label-text">
            Tinh trang
          </label>
          <select
            id="status"
            className="input"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">Tat ca</option>
            <option value="available">San hang</option>
            <option value="unavailable">Tam het</option>
          </select>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setQuery("");
              setCategory("all");
              setStatus("all");
            }}
          >
            Dat lai bo loc
          </button>
        </aside>

        <div className="product-content">
          <div className="product-grid compact-grid">
            {filteredProducts.map((product) => {
              const currentStatus = getRealtimeStatus(product);

              return (
                <article
                  className={`product-card compact ${
                    selectedProduct?.id === product.id ? "selected" : ""
                  }`}
                  key={product.id}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image compact"
                    onClick={() => setSelectedProduct(product)}
                  />
                  <div className="product-info compact">
                    <p className="product-category">{product.category}</p>
                    <h3>{product.name}</h3>
                    <p className="product-price">
                      {formatCurrency(product.pricePerDay)} / ngay
                    </p>
                    <p className={`status-chip ${currentStatus}`}>
                      {statusLabels[currentStatus]}
                    </p>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSelectedProduct(product)}
                    >
                      Xem chi tiet
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {selectedProduct ? (
            <section className="card product-detail-card">
              <div className="product-detail-head">
                <h3>{selectedProduct.name}</h3>
                <p>{selectedProduct.description}</p>
              </div>

              <div className="product-detail-row">
                <span>Gia thue theo ngay</span>
                <strong>{formatCurrency(selectedProduct.pricePerDay)}</strong>
              </div>

              <div className="product-detail-row">
                <span>Tinh trang hom nay</span>
                <strong>
                  {
                    statusLabels[getRealtimeStatus(selectedProduct)]
                  }
                </strong>
              </div>

              <div className="product-detail-row">
                <span>Kiem tra nhanh lich trong (7 ngay toi)</span>
                <strong>
                  {isDateRangeAvailable(
                    selectedProduct,
                    new Date().toISOString().split("T")[0],
                    new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0]
                  )
                    ? "Con slot"
                    : "Can dat som"}
                </strong>
              </div>

              <label htmlFor="size-select" className="label-text">
                Chon size
              </label>
              <select
                id="size-select"
                className="input"
                value={sizeSelection[selectedProduct.id] || selectedProduct.defaultSize}
                onChange={(event) =>
                  setSizeSelection((previous) => ({
                    ...previous,
                    [selectedProduct.id]: event.target.value
                  }))
                }
              >
                {selectedProduct.sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    Size {size}
                  </option>
                ))}
              </select>

              <div className="button-row">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleAddToCart(selectedProduct)}
                >
                  Them vao gio
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    navigate("/cart");
                  }}
                >
                  Di den gio hang
                </button>
              </div>
            </section>
          ) : (
            <section className="card empty-state">Khong tim thay san pham phu hop.</section>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
