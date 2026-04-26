import { useState } from "react";
import api from "../../../lib/api";
import ModulePage from "../../../components/common/ModulePage";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";

function DocumentsPage() {
  const { showToast } = useToast();
  const [refId, setRefId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [generated, setGenerated] = useState(null);
  const [fetched, setFetched] = useState(null);

  const generate = async () => {
    try {
      const res = await api.post("/documents/generate-pdf", { refId });
      setGenerated(res.data);
      setDocumentId(res.data.document?._id || "");
      showToast("PDF generated", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const fetchDocument = async () => {
    try {
      const res = await api.get(`/documents/${documentId}`);
      setFetched(res.data);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <ModulePage title="Documents" description="Generate aggregated PDF documents and fetch by ID.">
      <div className="inline-form">
        <input placeholder="Reference ID" value={refId} onChange={(e) => setRefId(e.target.value)} />
        <button className="btn-primary" type="button" onClick={generate}>
          Generate PDF
        </button>
      </div>
      <div className="inline-form">
        <input placeholder="Document ID" value={documentId} onChange={(e) => setDocumentId(e.target.value)} />
        <button className="btn-secondary" type="button" onClick={fetchDocument}>
          Fetch Document
        </button>
      </div>
      {generated ? <pre className="json-block">{JSON.stringify(generated, null, 2)}</pre> : null}
      {fetched ? <pre className="json-block">{JSON.stringify(fetched, null, 2)}</pre> : null}
    </ModulePage>
  );
}

export default DocumentsPage;
