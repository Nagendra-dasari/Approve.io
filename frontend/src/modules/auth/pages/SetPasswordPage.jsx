import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../lib/api";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";

function SetPasswordPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ inviteToken: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/set-password", form);
      showToast("Password set successfully", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Set Password</h2>
        <input
          placeholder="Invite token"
          value={form.inviteToken}
          onChange={(e) => setForm((prev) => ({ ...prev, inviteToken: e.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="New password"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          required
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Save Password"}
        </button>
        <Link to="/login">Back to login</Link>
      </form>
    </div>
  );
}

export default SetPasswordPage;
