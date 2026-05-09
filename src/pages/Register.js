import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import MainLayout from "../components/MainLayout";
import { apiUrl } from "../config/api";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isDisabled = useMemo(
    () => submitting || !email.trim() || !password || !confirmPassword,
    [confirmPassword, email, password, submitting]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password || !confirmPassword) {
      setErrorMessage("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await axios.post(apiUrl("/register"), { email, password });
      navigate("/login");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Đăng ký thất bại. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <section className="auth-page">
        <form className="card auth-card" onSubmit={handleSubmit} noValidate>
          <h2>Tạo tài khoản mới</h2>
          <p>Tạo tài khoản để lưu địa chỉ giao nhận và lịch sử đơn thuê.</p>

          <label htmlFor="register-email" className="label-text">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            className="input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <label htmlFor="register-password" className="label-text">
            Mật khẩu
          </label>
          <input
            id="register-password"
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhập mật khẩu"
            autoComplete="new-password"
          />

          <label htmlFor="register-confirm" className="label-text">
            Xác nhận mật khẩu
          </label>
          <input
            id="register-confirm"
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
          />

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <button type="submit" className="btn-primary" disabled={isDisabled}>
            {submitting ? "Đang xử lý..." : "Đăng ký"}
          </button>

          <p className="auth-note">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </form>
      </section>
    </MainLayout>
  );
}
