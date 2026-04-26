import { useState } from "react";
import api from "../../../lib/api";
import ModulePage from "../../../components/common/ModulePage";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";

function KycPage() {
  const { showToast } = useToast();
  const [initForm, setInitForm] = useState({ refType: "SUBMISSION", refId: "", aadhaarNumber: "" });
  const [verifyForm, setVerifyForm] = useState({ kycId: "", providerRef: "", otp: "", pan: "" });
  const [statusKycId, setStatusKycId] = useState("");
  const [statusResult, setStatusResult] = useState(null);

  const initiate = async (event) => {
    event.preventDefault();
    try {
      const res = await api.post("/kyc/initiate", initForm);
      showToast(`KYC initiated: ${res.data.kycId}`, "success");
      setVerifyForm((prev) => ({ ...prev, kycId: res.data.kycId, providerRef: res.data.providerRef }));
      setStatusKycId(res.data.kycId);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const verify = async (event) => {
    event.preventDefault();
    try {
      await api.post("/kyc/verify", verifyForm);
      showToast("KYC verification completed", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const getStatus = async () => {
    try {
      const res = await api.get(`/kyc/${statusKycId}/status`);
      setStatusResult(res.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <ModulePage title="KYC" description="Initiate Aadhaar OTP, verify OTP/PAN, and fetch status.">
      <form className="inline-form" onSubmit={initiate}>
        <input value={initForm.refType} onChange={(e) => setInitForm((p) => ({ ...p, refType: e.target.value }))} required />
        <input placeholder="Reference ID" value={initForm.refId} onChange={(e) => setInitForm((p) => ({ ...p, refId: e.target.value }))} required />
        <input
          placeholder="Aadhaar number"
          value={initForm.aadhaarNumber}
          onChange={(e) => setInitForm((p) => ({ ...p, aadhaarNumber: e.target.value }))}
          required
        />
        <button className="btn-primary" type="submit">
          Initiate
        </button>
      </form>
      <form className="inline-form" onSubmit={verify}>
        <input placeholder="KYC ID" value={verifyForm.kycId} onChange={(e) => setVerifyForm((p) => ({ ...p, kycId: e.target.value }))} required />
        <input
          placeholder="Provider ref"
          value={verifyForm.providerRef}
          onChange={(e) => setVerifyForm((p) => ({ ...p, providerRef: e.target.value }))}
          required
        />
        <input placeholder="OTP" value={verifyForm.otp} onChange={(e) => setVerifyForm((p) => ({ ...p, otp: e.target.value }))} required />
        <input placeholder="PAN (optional)" value={verifyForm.pan} onChange={(e) => setVerifyForm((p) => ({ ...p, pan: e.target.value }))} />
        <button className="btn-primary" type="submit">
          Verify
        </button>
      </form>
      <div className="inline-form">
        <input placeholder="KYC ID" value={statusKycId} onChange={(e) => setStatusKycId(e.target.value)} />
        <button className="btn-secondary" type="button" onClick={getStatus}>
          Check Status
        </button>
      </div>
      {statusResult ? <pre className="json-block">{JSON.stringify(statusResult, null, 2)}</pre> : null}
    </ModulePage>
  );
}

export default KycPage;
