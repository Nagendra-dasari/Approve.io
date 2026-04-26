import { useEffect, useState } from "react";
import api from "../../../lib/api";
import ModulePage from "../../../components/common/ModulePage";
import DataTable from "../../../components/common/DataTable";
import TenantScopeBanner from "../../../components/common/TenantScopeBanner";
import { getErrorMessage } from "../../../lib/error";
import { useToast } from "../../../components/common/ToastProvider";
import useAuth from "../../../hooks/useAuth";

function NotificationsPage() {
  const { showToast } = useToast();
  const { tenantContextId } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    channel: "IN_APP",
    message: "",
    eventType: "MANUAL",
    to: "",
    subject: "Notification",
  });

  const load = async () => {
    try {
      const res = await api.get("/notifications");
      setItems(res.data || []);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  useEffect(() => {
    let active = true;
    api
      .get("/notifications")
      .then((res) => {
        if (active) setItems(res.data || []);
      })
      .catch((error) => showToast(getErrorMessage(error), "error"));
    return () => {
      active = false;
    };
  }, [showToast, tenantContextId]);

  const create = async (event) => {
    event.preventDefault();
    try {
      await api.post("/notifications", form);
      showToast("Notification sent", "success");
      setForm({ channel: "IN_APP", message: "", eventType: "MANUAL", to: "", subject: "Notification" });
      load();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  return (
    <ModulePage title="Notifications" description="Create notifications and inspect dispatch status.">
      <TenantScopeBanner context="Notifications" />
      <form className="inline-form" onSubmit={create}>
        <input placeholder="Channel" value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))} required />
        <input placeholder="Event type" value={form.eventType} onChange={(e) => setForm((p) => ({ ...p, eventType: e.target.value }))} required />
        <input placeholder="Message" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} required />
        <input placeholder="To (email/phone)" value={form.to} onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))} />
        <button className="btn-primary" type="submit">
          Send
        </button>
      </form>
      <DataTable
        columns={[
          { key: "_id", label: "ID" },
          { key: "channel", label: "Channel" },
          { key: "eventType", label: "Event" },
          { key: "message", label: "Message" },
          { key: "status", label: "Status" },
        ]}
        rows={items}
      />
    </ModulePage>
  );
}

export default NotificationsPage;
