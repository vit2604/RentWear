import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";

const API_BASE = "http://localhost:5000";

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
      setErrorMessage("Vui long nhap day du email va mat khau.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await axios.post(`${API_BASE}/login`, {
        email,
        password
      });

      if (!response.data?.token) {
        setErrorMessage(response.data?.message || "Dang nhap that bai.");
        return;
      }

      setAuthData({
        token: response.data.token,
        user: response.data.user || { email }
      });

      navigate("/profile");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Khong ket noi duoc server. Kiem tra backend va thu lai."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <section className="auth-page">
        <form className="card auth-card" onSubmit={handleSubmit}>
          <h2>Chao mung tro lai</h2>
          <p>Dang nhap de quan ly profile va tiep tuc quy trinh dat thue.</p>

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
            Mat khau
          </label>
          <input
            id="login-password"
            type="password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nhap mat khau"
          />

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Dang xu ly..." : "Dang nhap"}
          </button>

          <p className="auth-note">
            Chua co tai khoan? <Link to="/register">Dang ky ngay</Link>
          </p>
        </form>
      </section>
    </MainLayout>
  );
}
