import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { apiUrl } from "../config/api";

export default function Login() {
  const navigate = useNavigate();
  const { setAuthData } = useAppContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await axios.post(apiUrl("/login"), {
        email,
        password
      });

      if (!response.data?.token) {
        setErrorMessage(response.data?.message || "Đăng nhập thất bại.");
        return;
      }

      setAuthData({
        token: response.data.token,
        user: response.data.user || { email }
      });

      navigate("/");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Không kết nối được server. Kiểm tra backend và thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <section className="auth-page">
        <form className="card auth-card" onSubmit={handleSubmit}>
          <h2>Chào mừng trở lại</h2>
          <p>Đăng nhập để tiếp tục thuê đồ và quản lý tài khoản.</p>

          <label htmlFor="login-email" className="label-text">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className="input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />

          <label htmlFor="login-password" className="label-text">
            Mật khẩu
          </label>
          <input
            id="login-password"
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhập mật khẩu"
          />

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Đang xử lý..." : "Đăng nhập"}
          </button>

          <p className="auth-note">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
          <p className="auth-note">
            Demo admin: đăng nhập bằng <strong>admin@rentwear.com</strong>.
          </p>
        </form>
      </section>
    </MainLayout>
  );
}
