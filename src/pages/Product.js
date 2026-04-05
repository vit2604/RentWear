import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { getRealtimeStatus, isDateRangeAvailable } from "../data/products";
import { formatCurrency } from "../utils/format";

const statusLabels = {
  available: "Sẵn hàng",
  unavailable: "Tạm hết"
};

const defaultProductForm = {
  name: "",
  category: "",
  pricePerDay: "",
  stock: "",
  sizeOptions: "S,M,L",
  defaultSize: "M",
  image: "",
  description: ""
};

export default function Product() {
  const navigate = useNavigate();
  const detailsRef = useRef(null);

  const { addProduct, addToCart, isAdmin, products, updateProduct } = useAppContext();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(products[0] || null);
  const [sizeSelection, setSizeSelection] = useState({});

  const [openForm, setOpenForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState("");
  const [form, setForm] = useState(defaultProductForm);
  const [formError, setFormError] = useState("");

  const categories = useMemo(
    () => ["all", ...new Set(products.map((product) => product.category))],
    [products]
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
  }, [category, products, query, status]);

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

  const scrollToDetails = () => {
    if (detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSelectProduct = (product, shouldScroll = false) => {
    setSelectedProduct(product);

    if (shouldScroll) {
      requestAnimationFrame(() => {
        setTimeout(scrollToDetails, 80);
      });
    }
  };

  const handleAddToCart = (product) => {
    const size = sizeSelection[product.id] || product.defaultSize;
    addToCart(product, size);
  };

  const resetForm = () => {
    setForm(defaultProductForm);
    setEditingProductId("");
    setFormError("");
  };

  const openCreateProduct = () => {
    resetForm();
    setOpenForm(true);
  };

  const openEditProduct = (product) => {
    setEditingProductId(product.id);
    setFormError("");
    setForm({
      name: product.name,
      category: product.category,
      pricePerDay: String(product.pricePerDay),
      stock: String(product.stock),
      sizeOptions: product.sizeOptions.join(","),
      defaultSize: product.defaultSize,
      image: product.image,
      description: product.description
    });
    setOpenForm(true);
  };

  const handleSubmitProduct = (event) => {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim() || !form.category.trim()) {
      setFormError("Tên sản phẩm và danh mục là bắt buộc.");
      return;
    }

    const payload = {
      name: form.name,
      category: form.category,
      pricePerDay: Number(form.pricePerDay),
      stock: Number(form.stock),
      sizeOptions: form.sizeOptions,
      defaultSize: form.defaultSize,
      image: form.image,
      description: form.description
    };

    if (editingProductId) {
      const updated = updateProduct(editingProductId, payload);
      if (updated) {
        setSelectedProduct(updated);
      }
    } else {
      const created = addProduct(payload);
      setSelectedProduct(created);
    }

    setOpenForm(false);
    resetForm();
  };

  return (
    <MainLayout>
      <section className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="section-heading section-heading-left !mb-0">
          <h2>Danh sách sản phẩm</h2>
          <p>Tìm kiếm theo tên, danh mục và tình trạng cho thuê.</p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={openCreateProduct}
            className="mt-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-white shadow transition hover:scale-105 hover:bg-brand-hover"
            title="Thêm sản phẩm"
            aria-label="Thêm sản phẩm"
          >
            +
          </button>
        ) : null}
      </section>

      <div className="product-layout">
        <aside className="card filter-card">
          <h3>Bộ lọc</h3>

          <label htmlFor="search" className="label-text">
            Tìm kiếm
          </label>
          <input
            id="search"
            type="text"
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nhập tên sản phẩm"
          />

          <label htmlFor="category" className="label-text">
            Danh mục
          </label>
          <select
            id="category"
            className="input"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Tất cả" : item}
              </option>
            ))}
          </select>

          <label htmlFor="status" className="label-text">
            Tình trạng
          </label>
          <select
            id="status"
            className="input"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="available">Sẵn hàng</option>
            <option value="unavailable">Tạm hết</option>
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
            Đặt lại bộ lọc
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
                    onClick={() => handleSelectProduct(product)}
                  />
                  <div className="product-info compact">
                    <p className="product-category">{product.category}</p>
                    <h3>{product.name}</h3>
                    <p className="product-price">
                      {formatCurrency(product.pricePerDay)} / ngày
                    </p>
                    <p className={`status-chip ${currentStatus}`}>
                      {statusLabels[currentStatus]}
                    </p>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleSelectProduct(product, true)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {selectedProduct ? (
            <section ref={detailsRef} className="card product-detail-card">
              <div className="product-detail-head">
                <h3>{selectedProduct.name}</h3>
                <p>{selectedProduct.description}</p>
              </div>

              <div className="product-detail-row">
                <span>Giá thuê theo ngày</span>
                <strong>{formatCurrency(selectedProduct.pricePerDay)}</strong>
              </div>

              <div className="product-detail-row">
                <span>Tình trạng hôm nay</span>
                <strong>{statusLabels[getRealtimeStatus(selectedProduct)]}</strong>
              </div>

              <div className="product-detail-row">
                <span>Kiểm tra nhanh lịch trống (7 ngày tới)</span>
                <strong>
                  {isDateRangeAvailable(
                    selectedProduct,
                    new Date().toISOString().split("T")[0],
                    new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0]
                  )
                    ? "Còn lịch"
                    : "Nên đặt sớm"}
                </strong>
              </div>

              <label htmlFor="size-select" className="label-text">
                Chọn kích cỡ
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
                    Cỡ {size}
                  </option>
                ))}
              </select>

              <div className="button-row">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleAddToCart(selectedProduct)}
                >
                  Thêm vào giỏ
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    navigate("/cart");
                  }}
                >
                  Đi đến giỏ hàng
                </button>
              </div>

              {isAdmin ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => openEditProduct(selectedProduct)}
                >
                  Sửa thông tin sản phẩm
                </button>
              ) : null}
            </section>
          ) : (
            <section className="card empty-state">Không tìm thấy sản phẩm phù hợp.</section>
          )}
        </div>
      </div>

      {openForm ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-3">
          <div className="w-[min(680px,100%)] rounded-2xl border border-line bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="m-0 text-xl font-semibold">
                {editingProductId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h3>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setOpenForm(false);
                  resetForm();
                }}
              >
                Đóng
              </button>
            </div>

            <form className="grid gap-2" onSubmit={handleSubmitProduct}>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label htmlFor="modal-name" className="label-text">
                    Tên sản phẩm
                  </label>
                  <input
                    id="modal-name"
                    className="input"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label htmlFor="modal-category" className="label-text">
                    Danh mục
                  </label>
                  <input
                    id="modal-category"
                    className="input"
                    value={form.category}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, category: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="modal-price" className="label-text">
                    Giá/ngày
                  </label>
                  <input
                    id="modal-price"
                    type="number"
                    className="input"
                    value={form.pricePerDay}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, pricePerDay: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label htmlFor="modal-stock" className="label-text">
                    Tồn kho
                  </label>
                  <input
                    id="modal-stock"
                    type="number"
                    className="input"
                    value={form.stock}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, stock: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label htmlFor="modal-sizes" className="label-text">
                    Danh sách cỡ (S,M,L)
                  </label>
                  <input
                    id="modal-sizes"
                    className="input"
                    value={form.sizeOptions}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, sizeOptions: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label htmlFor="modal-default-size" className="label-text">
                    Cỡ mặc định
                  </label>
                  <input
                    id="modal-default-size"
                    className="input"
                    value={form.defaultSize}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, defaultSize: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label htmlFor="modal-image" className="label-text">
                  Link ảnh
                </label>
                <input
                  id="modal-image"
                  className="input"
                  value={form.image}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, image: event.target.value }))
                  }
                />
              </div>

              <div>
                <label htmlFor="modal-description" className="label-text">
                  Mô tả
                </label>
                <textarea
                  id="modal-description"
                  className="input textarea"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </div>

              {formError ? <p className="form-error">{formError}</p> : null}

              <button type="submit" className="btn-primary">
                {editingProductId ? "Lưu thay đổi" : "Thêm sản phẩm"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}
