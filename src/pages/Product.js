import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { getRealtimeStatus } from "../data/products";
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
  const { addProduct, isAdmin, products, updateProduct, setBooking, setCheckoutItems } = useAppContext();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [status, setStatus] = useState("all");

  const [openForm, setOpenForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState("");
  const [form, setForm] = useState(defaultProductForm);
  const [formError, setFormError] = useState("");

  const [isMobileView, setIsMobileView] = useState(() =>
    window.matchMedia("(max-width: 992px)").matches
  );
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 992px)");
    const onChange = (event) => {
      setIsMobileView(event.matches);
      if (!event.matches) {
        setIsMobileFilterOpen(false);
      }
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    }

    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, []);

  const categories = useMemo(
    () => ["all", ...new Set(products.map((product) => product.category))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = debouncedQuery.toLowerCase().trim();

    return products.filter((product) => {
      const currentStatus = getRealtimeStatus(product);
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        product.sizeOptions.some((sizeOption) => sizeOption.toLowerCase().includes(normalizedQuery));

      const matchesCategory = category === "all" || product.category === category;
      const matchesStatus = status === "all" || currentStatus === status;
      const matchesSize = sizeFilter === "all" || product.sizeOptions.includes(sizeFilter);

      return matchesQuery && matchesCategory && matchesStatus && matchesSize;
    });
  }, [category, debouncedQuery, products, sizeFilter, status]);

  const resetFilter = () => {
    setQuery("");
    setDebouncedQuery("");
    setCategory("all");
    setSizeFilter("all");
    setStatus("all");
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
      updateProduct(editingProductId, payload);
    } else {
      addProduct(payload);
    }

    setOpenForm(false);
    resetForm();
  };

  const handleQuickRent = (product) => {
    const now = new Date();
    const startDate = now.toISOString().split("T")[0];
    const end = new Date(now);
    end.setDate(now.getDate() + 1);
    const endDate = end.toISOString().split("T")[0];

    const item = {
      productId: product.id,
      name: product.name,
      image: product.image,
      pricePerDay: product.pricePerDay,
      size: product.defaultSize,
      quantity: 1
    };

    setCheckoutItems([item]);
    setBooking({
      startDate,
      endDate,
      days: 1,
      items: [item],
      subtotal: product.pricePerDay,
      shippingFee: 0,
      discount: 0,
      total: product.pricePerDay,
      customer: {
        name: "",
        phone: "",
        address: ""
      },
      note: ""
    });

    navigate("/payment", { state: { focus: "methods" } });
  };

  const renderFilterFields = () => (
    <>
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
      <select id="category" className="input" value={category} onChange={(event) => setCategory(event.target.value)}>
        {categories.map((item) => (
          <option key={item} value={item}>
            {item === "all" ? "Tất cả" : item}
          </option>
        ))}
      </select>

      <label htmlFor="size" className="label-text">
        Size
      </label>
      <select id="size" className="input" value={sizeFilter} onChange={(event) => setSizeFilter(event.target.value)}>
        <option value="all">Tất cả</option>
        <option value="S">S</option>
        <option value="M">M</option>
        <option value="L">L</option>
        <option value="XL">XL</option>
      </select>

      <label htmlFor="status" className="label-text">
        Tình trạng
      </label>
      <select id="status" className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="all">Tất cả</option>
        <option value="available">Sẵn hàng</option>
        <option value="unavailable">Tạm hết</option>
      </select>

      <button type="button" className="btn-secondary" onClick={resetFilter}>
        Đặt lại bộ lọc
      </button>
    </>
  );

  return (
    <MainLayout>
      <section className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="section-heading section-heading-left !mb-0">
          <h2>Danh sách sản phẩm</h2>
          <p>Lọc theo tên, danh mục, size và tình trạng.</p>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {isMobileView ? (
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink md:hidden"
              onClick={() => setIsMobileFilterOpen(true)}
              aria-label="Mở bộ lọc sản phẩm"
            >
              <span aria-hidden="true">☰</span>
              <span>Bộ lọc</span>
            </button>
          ) : null}

          {isAdmin ? (
            <button
              type="button"
              onClick={openCreateProduct}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-white shadow transition hover:scale-105 hover:bg-brand-hover"
              title="Thêm sản phẩm"
              aria-label="Thêm sản phẩm"
            >
              +
            </button>
          ) : null}
        </div>
      </section>

      <div className="product-layout">
        {!isMobileView ? (
          <aside className="card filter-card">
            <h3>Bộ lọc</h3>
            {renderFilterFields()}
          </aside>
        ) : null}

        <div className="product-content">
          <p className="meta-text">Tìm thấy {filteredProducts.length} sản phẩm phù hợp.</p>

          <div className="product-grid compact-grid">
            {filteredProducts.map((product) => {
              const currentStatus = getRealtimeStatus(product);

              return (
                <article className="product-card compact" key={product.id}>
                  <img src={product.image} alt={product.name} className="product-image compact" />
                  <div className="product-info compact">
                    <p className="product-category">{product.category}</p>
                    <h3>{product.name}</h3>
                    <p className="product-price">{formatCurrency(product.pricePerDay)} / ngày</p>
                    <p className={`status-chip ${currentStatus}`}>{statusLabels[currentStatus]}</p>

                    <button type="button" className="btn-primary" onClick={() => handleQuickRent(product)}>
                      Thuê nhanh
                    </button>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => navigate(`/product/${product.id}`, { state: { focus: "rent-options" } })}
                    >
                      Xem chi tiết
                    </button>

                    {isAdmin ? (
                      <button type="button" className="btn-link" onClick={() => openEditProduct(product)}>
                        Sửa sản phẩm
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          {filteredProducts.length === 0 ? (
            <section className="card empty-state">Không tìm thấy sản phẩm phù hợp.</section>
          ) : null}
        </div>
      </div>

      {isMobileView && isMobileFilterOpen ? (
        <div
          className="fixed inset-0 z-[90] bg-black/40 px-3 py-4 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Bộ lọc sản phẩm"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <aside
            className="ml-auto h-full w-[min(360px,92vw)] overflow-y-auto rounded-2xl border border-line bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="m-0 text-lg">Bộ lọc sản phẩm</h3>
              <button type="button" className="btn-link" onClick={() => setIsMobileFilterOpen(false)}>
                Đóng
              </button>
            </div>
            {renderFilterFields()}
          </aside>
        </div>
      ) : null}

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
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
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
                    onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
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
                    onChange={(event) => setForm((prev) => ({ ...prev, pricePerDay: event.target.value }))}
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
                    onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
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
                    onChange={(event) => setForm((prev) => ({ ...prev, sizeOptions: event.target.value }))}
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
                    onChange={(event) => setForm((prev) => ({ ...prev, defaultSize: event.target.value }))}
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
                  onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
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
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
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
