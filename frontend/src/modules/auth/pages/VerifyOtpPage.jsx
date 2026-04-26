import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../lib/api";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";

function VerifyOtpPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ inviteToken: "", otpCode: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResult("");
    try {
      const res = await api.post("/auth/verify-otp", form);
      setResult(res.data.message);
      showToast("OTP verified", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Verify Invite OTP</h2>
        <input
          placeholder="Invite token"
          value={form.inviteToken}
          onChange={(e) => setForm((prev) => ({ ...prev, inviteToken: e.target.value }))}
          required
        />
        <input
          placeholder="6-digit OTP"
          value={form.otpCode}
          onChange={(e) => setForm((prev) => ({ ...prev, otpCode: e.target.value }))}
          required
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>
        {result ? <p>{result}</p> : null}
        <Link to="/login">Back to login</Link>
      </form>
    </div>
  );
}

export default VerifyOtpPage;
