import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import MainLayout from "../components/MainLayout";

const API_BASE = "http://localhost:5000";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password || !confirmPassword) {
      setErrorMessage("Vui long nhap day du thong tin.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mat khau xac nhan khong trung khop.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await axios.post(`${API_BASE}/register`, { email, password });
      navigate("/login");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Dang ky that bai. Vui long thu lai."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <section className="auth-page">
        <form className="card auth-card" onSubmit={handleSubmit}>
          <h2>Tao tai khoan moi</h2>
          <p>Tao tai khoan de luu dia chi giao nhan va lich su don thue.</p>

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
          />

          <label htmlFor="register-password" className="label-text">
            Mat khau
          </label>
          <input
            id="register-password"
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhap mat khau"
          />

          <label htmlFor="register-confirm" className="label-text">
            Xac nhan mat khau
          </label>
          <input
            id="register-confirm"
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Nhap lai mat khau"
          />

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Dang xu ly..." : "Dang ky"}
          </button>

          <p className="auth-note">
            Da co tai khoan? <Link to="/login">Dang nhap</Link>
          </p>
        </form>
      </section>
    </MainLayout>
  );
}
