import { useState } from "react";
import api from "../../../lib/api";
import ModulePage from "../../../components/common/ModulePage";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";

function SignaturesPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ refId: "", type: "APPROVAL", fileUrl: "" });
  const [created, setCreated] = useState(null);

  const create = async (event) => {
    event.preventDefault();
    try {
      const res = await api.post("/signatures", form);
      setCreated(res.data);
      showToast("Signature recorded", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <ModulePage title="Signatures" description="Create immutable signature chain entries.">
      <form className="inline-form" onSubmit={create}>
        <input placeholder="Reference ID" value={form.refId} onChange={(e) => setForm((p) => ({ ...p, refId: e.target.value }))} required />
        <input placeholder="Type" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} required />
        <input placeholder="File URL" value={form.fileUrl} onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))} required />
        <button className="btn-primary" type="submit">
          Add Signature
        </button>
      </form>
      {created ? <pre className="json-block">{JSON.stringify(created, null, 2)}</pre> : null}
    </ModulePage>
  );
}

export default SignaturesPage;
