import { useState } from "react";
import api from "../../../lib/api";
import ModulePage from "../../../components/common/ModulePage";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";

function PublicLinksPage() {
  const { showToast } = useToast();
  const [tokenForm, setTokenForm] = useState({
    formId: "",
    externalType: "CUSTOMER",
    name: "",
    email: "",
    phone: "",
    expiresInMinutes: 1440,
  });
  const [publicToken, setPublicToken] = useState("");
  const [publicFormData, setPublicFormData] = useState(null);
  const [publicSubmitJson, setPublicSubmitJson] = useState('{"sample":"value"}');

  const generateToken = async (event) => {
    event.preventDefault();
    try {
      const { formId, ...payload } = tokenForm;
      const res = await api.post(`/forms/${formId}/public-token`, payload);
      setPublicToken(res.data.token);
      showToast("Public token generated", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const fetchPublicForm = async () => {
    if (!publicToken) return;
    try {
      const res = await api.get(`/forms/public/${publicToken}`);
      setPublicFormData(res.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const submitPublicForm = async () => {
    if (!publicToken) return;
    try {
      const payload = JSON.parse(publicSubmitJson);
      await api.post(`/forms/public/${publicToken}/submit`, payload);
      showToast("Public form submitted", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <ModulePage title="Public Form Links" description="Issue tokenized links and validate external form submission flow.">
      <form className="inline-form" onSubmit={generateToken}>
        <input
          placeholder="Form ID"
          value={tokenForm.formId}
          onChange={(e) => setTokenForm((p) => ({ ...p, formId: e.target.value }))}
          required
        />
        <input
          placeholder="External type"
          value={tokenForm.externalType}
          onChange={(e) => setTokenForm((p) => ({ ...p, externalType: e.target.value }))}
          required
        />
        <input placeholder="Name" value={tokenForm.name} onChange={(e) => setTokenForm((p) => ({ ...p, name: e.target.value }))} required />
        <input placeholder="Email" value={tokenForm.email} onChange={(e) => setTokenForm((p) => ({ ...p, email: e.target.value }))} />
        <input placeholder="Phone" value={tokenForm.phone} onChange={(e) => setTokenForm((p) => ({ ...p, phone: e.target.value }))} />
        <button className="btn-primary" type="submit">
          Generate Token
        </button>
      </form>
      {publicToken ? <p className="token-text">Token: {publicToken}</p> : null}
      <div className="inline-form">
        <button className="btn-secondary" type="button" onClick={fetchPublicForm}>
          Fetch Public Form
        </button>
        <input value={publicSubmitJson} onChange={(e) => setPublicSubmitJson(e.target.value)} />
        <button className="btn-primary" type="button" onClick={submitPublicForm}>
          Submit Public Payload
        </button>
      </div>
      {publicFormData ? <pre className="json-block">{JSON.stringify(publicFormData, null, 2)}</pre> : null}
    </ModulePage>
  );
}

export default PublicLinksPage;
