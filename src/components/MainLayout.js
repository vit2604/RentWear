import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const navClassName = ({ isActive }) =>
  isActive ? "nav-link nav-link-active" : "nav-link";

export default function MainLayout({ children, withContainer = true }) {
  const { cartCount, user, isAuthenticated, logout } = useAppContext();
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
              Home
            </NavLink>
            <NavLink to="/product" className={navClassName}>
              San pham
            </NavLink>
            <NavLink to="/cart" className={navClassName}>
              Gio hang
              {cartCount > 0 ? <span className="cart-badge">{cartCount}</span> : null}
            </NavLink>
            <NavLink to="/booking" className={navClassName}>
              Booking
            </NavLink>
            <NavLink to="/orders" className={navClassName}>
              Don hang
            </NavLink>
          </nav>

          <div className="auth-quick-actions">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="profile-chip">
                  {user?.email || "Tai khoan"}
                </Link>
                <button type="button" className="btn-link" onClick={handleLogout}>
                  Dang xuat
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline">
                  Dang nhap
                </Link>
                <Link to="/register" className="btn-primary btn-small">
                  Dang ky
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
    </div>
  );
}
