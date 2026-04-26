import { useState } from "react";
import api from "../../../lib/api";
import ModulePage from "../../../components/common/ModulePage";
import TenantScopeBanner from "../../../components/common/TenantScopeBanner";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";

function ImportsPage() {
  const { showToast } = useToast();
  const [file, setFile] = useState(null);
  const [rowsJson, setRowsJson] = useState('[{"name":"John Doe","email":"john@example.com"}]');
  const [result, setResult] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (!file) {
      showToast("Select a file first", "error");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("rows", JSON.parse(rowsJson));
      const res = await api.post("/imports/employees", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      showToast("Import processed", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <ModulePage title="Imports" description="Upload employee import files and inspect import result.">
      <TenantScopeBanner context="Imports" />
      <form className="inline-form" onSubmit={submit}>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <input value={rowsJson} onChange={(e) => setRowsJson(e.target.value)} />
        <button className="btn-primary" type="submit">
          Run Import
        </button>
      </form>
      {result ? <pre className="json-block">{JSON.stringify(result, null, 2)}</pre> : null}
    </ModulePage>
  );
}

export default ImportsPage;
