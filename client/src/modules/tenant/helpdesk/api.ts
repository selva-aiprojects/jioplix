import axios from "axios";
import { API_BASE_URL as API_BASE } from "../../../config/api";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "x-tenant-id": localStorage.getItem("tenant") || "",
});

export const hd = {
  async ensure() {
    const { data } = await axios.get(`${API_BASE}/api/helpdesk/ensure`, { headers: getHeaders() });
    return data;
  },
  async categories() {
    const { data } = await axios.get(`${API_BASE}/api/helpdesk/categories`, { headers: getHeaders() });
    return Array.isArray(data) ? data : [];
  },
  async analytics() {
    const { data } = await axios.get(`${API_BASE}/api/helpdesk/analytics`, { headers: getHeaders() });
    return data;
  },
  async listTickets(filters: Record<string, any> = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });
    const { data } = await axios.get(`${API_BASE}/api/helpdesk/tickets?${params.toString()}`, { headers: getHeaders() });
    return Array.isArray(data) ? data : [];
  },
  async getTicket(id: string) {
    const { data } = await axios.get(`${API_BASE}/api/helpdesk/tickets/${id}`, { headers: getHeaders() });
    return data;
  },
  async createTicket(payload: Record<string, any>) {
    const { data } = await axios.post(`${API_BASE}/api/helpdesk/tickets`, payload, { headers: getHeaders() });
    return data;
  },
  async updateTicket(id: string, payload: Record<string, any>) {
    const { data } = await axios.patch(`${API_BASE}/api/helpdesk/tickets/${id}`, payload, { headers: getHeaders() });
    return data;
  },
  async addNote(id: string, body: string, isInternal = true) {
    const { data } = await axios.post(`${API_BASE}/api/helpdesk/tickets/${id}/notes`, { body, isInternal }, { headers: getHeaders() });
    return data;
  },
  async escalations(id: string) {
    const { data } = await axios.get(`${API_BASE}/api/helpdesk/tickets/${id}/escalations`, { headers: getHeaders() });
    return Array.isArray(data) ? data : [];
  },
  async escalate(id: string, reason: string) {
    const { data } = await axios.post(`${API_BASE}/api/helpdesk/tickets/${id}/escalate`, { reason }, { headers: getHeaders() });
    return data;
  },
  async pendingEscalations() {
    const { data } = await axios.get(`${API_BASE}/api/helpdesk/escalations/pending`, { headers: getHeaders() });
    return Array.isArray(data) ? data : [];
  },
  async equipment() {
    const { data } = await axios.get(`${API_BASE}/api/helpdesk/equipment`, { headers: getHeaders() });
    return Array.isArray(data) ? data : [];
  },
  async createEquipment(payload: Record<string, any>) {
    const { data } = await axios.post(`${API_BASE}/api/helpdesk/equipment`, payload, { headers: getHeaders() });
    return data;
  },
  async updateEquipment(id: string, payload: Record<string, any>) {
    const { data } = await axios.put(`${API_BASE}/api/helpdesk/equipment/${id}`, payload, { headers: getHeaders() });
    return data;
  },
  async deleteEquipment(id: string) {
    const { data } = await axios.delete(`${API_BASE}/api/helpdesk/equipment/${id}`, { headers: getHeaders() });
    return data;
  },
};

export { getHeaders };
