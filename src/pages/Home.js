import { useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { products } from "../data/products";
import { formatCurrency } from "../utils/format";

const featuredProducts = products.slice(0, 4);

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useAppContext();

  const handleAddToCart = (product) => {
    addToCart(product, product.defaultSize);
    navigate("/cart");
  };

  return (
    <MainLayout withContainer={false}>
      <section className="hero-banner">
        <div className="hero-overlay">
          <div className="container hero-content">
            <p className="hero-kicker">PREMIUM RENTAL COLLECTION</p>
            <h1>Elegance for Rent</h1>
            <p>
              Thue trang phuc cao cap theo ngay, linh hoat lich giao nhan va tiet
              kiem chi phi.
            </p>
            <button
              type="button"
              className="btn-primary hero-btn"
              onClick={() => navigate("/product")}
            >
              Kham pha bo suu tap
            </button>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <h2>Trending Now</h2>
          <p>Cac mau trang phuc duoc dat nhieu trong tuan nay.</p>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <img src={product.image} alt={product.name} className="product-image" />
              <div className="product-info">
                <p className="product-category">{product.category}</p>
                <h3>{product.name}</h3>
                <p className="product-price">
                  {formatCurrency(product.pricePerDay)} / ngay
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleAddToCart(product)}
                >
                  Them vao gio
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
