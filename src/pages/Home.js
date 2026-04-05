import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { formatCurrency } from "../utils/format";

export default function Home() {
  const navigate = useNavigate();
  const { addToCart, products } = useAppContext();
  const featuredProducts = products.slice(0, 4);

  const handleAddToCart = (product) => {
    addToCart(product, product.defaultSize);
    navigate("/cart");
  };

  return (
    <MainLayout withContainer={false}>
      <section className="hero-banner">
        <div className="hero-overlay">
          <div className="container hero-content">
            <p className="hero-kicker">BỘ SƯU TẬP THUÊ CAO CẤP</p>
            <h1>Tinh Hoa Thời Trang Cho Thuê</h1>
            <p>
              Thuê trang phục cao cấp theo ngày, linh hoạt lịch giao nhận và tiết
              kiệm chi phí.
            </p>
            <button
              type="button"
              className="btn-primary hero-btn"
              onClick={() => navigate("/product")}
            >
              Khám phá bộ sưu tập
            </button>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <h2>Xu Hướng Nổi Bật</h2>
          <p>Các mẫu trang phục được đặt nhiều trong tuần này.</p>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <img src={product.image} alt={product.name} className="product-image" />
              <div className="product-info">
                <p className="product-category">{product.category}</p>
                <h3>{product.name}</h3>
                <p className="product-price">
                  {formatCurrency(product.pricePerDay)} / ngày
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleAddToCart(product)}
                >
                  Thêm vào giỏ
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
