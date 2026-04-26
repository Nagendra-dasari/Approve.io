import { useEffect, useState } from "react";
import api from "../../../lib/api";
import ModulePage from "../../../components/common/ModulePage";
import DataTable from "../../../components/common/DataTable";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";

function PermissionsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/permissions");
        setItems(res.data || []);
      } catch (error) {
        showToast(getErrorMessage(error), "error");
      }
    }
    load();
  }, [showToast]);

  return (
    <ModulePage title="Permissions" description="Permission catalog currently configured in backend.">
      <DataTable
        columns={[
          { key: "code", label: "Code" },
          { key: "module", label: "Module" },
          { key: "action", label: "Action" },
          { key: "description", label: "Description" },
        ]}
        rows={items}
      />
    </ModulePage>
  );
}

export default PermissionsPage;
