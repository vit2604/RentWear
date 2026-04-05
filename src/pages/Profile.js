import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";

const API_BASE = "http://localhost:5000";

export default function Profile() {
  const { token, user, setUser } = useAppContext();

  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!isMounted) {
          return;
        }

        const profile = response.data;
        setEmail(profile.email || "");
        setPhone(profile.phone || "");
        setAddress(profile.address || "");
        setUser(profile);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error.response?.data?.message ||
              "Khong tai duoc thong tin profile."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [setUser, token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await axios.put(
        `${API_BASE}/profile`,
        { phone, address },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUser(response.data.user);
      setStatusMessage("Cap nhat profile thanh cong.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Khong cap nhat duoc profile. Vui long thu lai."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <section className="section-heading section-heading-left">
        <h2>Profile ca nhan</h2>
        <p>Cap nhat so dien thoai va dia chi de giao nhan nhanh hon.</p>
      </section>

      <form className="card profile-form" onSubmit={handleSubmit}>
        {loading ? <p>Dang tai thong tin...</p> : null}

        <div>
          <label htmlFor="profile-email" className="label-text">
            Email dang ky
          </label>
          <input
            id="profile-email"
            type="email"
            className="input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className="label-text">
            So dien thoai
          </label>
          <input
            id="profile-phone"
            type="tel"
            className="input"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Nhap so dien thoai"
          />
        </div>

        <div>
          <label htmlFor="profile-address" className="label-text">
            Dia chi nhan do
          </label>
          <textarea
            id="profile-address"
            className="input textarea"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="So nha, duong, quan/huyen, tinh/thanh"
          />
        </div>

        {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Dang luu..." : "Luu thay doi"}
        </button>
      </form>
    </MainLayout>
  );
}
