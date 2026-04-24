import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../components/MainLayout";
import { useAppContext } from "../context/AppContext";
import { apiUrl } from "../config/api";

export default function Profile() {
  const { token, user, setUser } = useAppContext();
  const role = user?.role || "customer";

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
        const response = await axios.get(apiUrl("/profile"), {
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
              "Không tải được thông tin hồ sơ."
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
        apiUrl("/profile"),
        { phone, address },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUser(response.data.user);
      setStatusMessage("Cập nhật hồ sơ thành công.");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Không cập nhật được hồ sơ. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <section className="section-heading section-heading-left">
        <h2>Hồ sơ cá nhân</h2>
        <p>Cập nhật số điện thoại và địa chỉ để giao nhận nhanh hơn.</p>
      </section>

      <form className="card profile-form" onSubmit={handleSubmit}>
        {loading ? <p>Đang tải thông tin...</p> : null}

        <div>
          <label htmlFor="profile-email" className="label-text">
            Email đăng ký
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
          <label htmlFor="profile-role" className="label-text">
            Vai trò tài khoản
          </label>
          <input
            id="profile-role"
            type="text"
            className="input"
            value={role === "admin" ? "Quản trị viên" : "Khách hàng"}
            disabled
          />
        </div>

        <div>
          <label htmlFor="profile-phone" className="label-text">
            Số điện thoại
          </label>
          <input
            id="profile-phone"
            type="tel"
            className="input"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Nhập số điện thoại"
          />
        </div>

        <div>
          <label htmlFor="profile-address" className="label-text">
            Địa chỉ nhận đồ
          </label>
          <textarea
            id="profile-address"
            className="input textarea"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
          />
        </div>

        {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </MainLayout>
  );
}
