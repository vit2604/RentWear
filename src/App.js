import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./style.css";

import { useAppContext } from "./context/AppContext";
import AdminDashboard from "./pages/AdminDashboard";
import Booking from "./pages/Booking";
import Cart from "./pages/Cart";
import Deposit from "./pages/Deposit";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import PaymentProcess from "./pages/PaymentProcess";
import Product from "./pages/Product";
import ProductDetail from "./pages/ProductDetail";
import Profile from "./pages/Profile";
import Register from "./pages/Register";

function RequireAuth({ children }) {
  const { isAuthenticated } = useAppContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RequireAdmin({ children }) {
  const { isAuthenticated, isAdmin } = useAppContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route path="/product" element={<Product />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/booking"
          element={
            <RequireAuth>
              <Booking />
            </RequireAuth>
          }
        />
        <Route
          path="/payment"
          element={
            <RequireAuth>
              <Deposit />
            </RequireAuth>
          }
        />
        <Route path="/deposit" element={<Navigate to="/payment" replace />} />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <Orders />
            </RequireAuth>
          }
        />
        <Route
          path="/payment-process"
          element={
            <RequireAuth>
              <PaymentProcess />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
