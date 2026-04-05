import { Link, NavLink, useNavigate } from "react-router-dom";
import ChatWidget from "./ChatWidget";
import { useAppContext } from "../context/AppContext";

const navClassName = ({ isActive }) =>
  isActive ? "nav-link nav-link-active" : "nav-link";

export default function MainLayout({ children, withContainer = true }) {
  const { cartCount, user, isAdmin, isAuthenticated, logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="container top-nav-inner">
          <Link to="/" className="brand">
            RentWear
          </Link>

          <nav className="top-nav-links">
            <NavLink to="/" className={navClassName}>
              Trang chủ
            </NavLink>
            <NavLink to="/product" className={navClassName}>
              Sản phẩm
            </NavLink>
            <NavLink to="/cart" className={navClassName}>
              Giỏ hàng
              {cartCount > 0 ? <span className="cart-badge">{cartCount}</span> : null}
            </NavLink>
            <NavLink to="/booking" className={navClassName}>
              Đặt lịch
            </NavLink>
            <NavLink to="/orders" className={navClassName}>
              Đơn hàng
            </NavLink>
            {isAdmin ? (
              <NavLink to="/admin" className={navClassName}>
                Quản trị
              </NavLink>
            ) : null}
          </nav>

          <div className="auth-quick-actions">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="profile-chip">
                  {user?.email || "Tài khoản"}
                </Link>
                <button type="button" className="btn-link" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary btn-small">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {withContainer ? (
        <main className="container page-content">{children}</main>
      ) : (
        <main>{children}</main>
      )}
      <ChatWidget />
    </div>
  );
}
