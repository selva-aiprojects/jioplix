process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const axios = require('axios');

const BASE = 'http://localhost:4000';
const user = process.env.NEXUS_ADMIN_USER;
const pass = process.env.NEXUS_ADMIN_PASSWORD;

(async () => {
  try {
    const pubs = await axios.get(`${BASE}/api/nexus/tenants/public`);
    const fac = (pubs.data || []).find(t => /kkcth/i.test(String(t.name || '')));
    const facility = fac ? fac.id : '7c1a707d-abf3-44ea-9e3b-a23d24ab0fd5';
    const login = await axios.post(`${BASE}/api/auth/login`, { type: 'tenant', facility, email: user, password: pass });
    const token = login.data.token;
    const tenantId = login.data.tenantId;
    const headers = { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId };
    console.log('LOGIN OK, menus:', login.data.menus?.filter(m => /helpdesk/i.test(m.label) || /support/i.test(m.label)).map(m => m.label).join(', ') || 'NONE');

    const ensure = await axios.get(`${BASE}/api/helpdesk/ensure`, { headers });
    console.log('ENSURE OK tables:', ensure.data.tables.length, ensure.data.tables.join(','));

    const cats = await axios.get(`${BASE}/api/helpdesk/categories`, { headers });
    console.log('CATEGORIES OK:', cats.data.map(c => `${c.name}(${c.type})`).join(', '));

    const analytics = await axios.get(`${BASE}/api/helpdesk/analytics`, { headers });
    console.log('ANALYTICS OK:', JSON.stringify({ total: analytics.data.kpi.total_tickets, open: analytics.data.kpi.open_tickets, byStatus: analytics.data.byStatus.length, trend: analytics.data.trend.length }));

    const eq = await axios.post(`${BASE}/api/helpdesk/equipment`, { name: 'E2E Smoke Test Ventilator', asset_tag: 'E2E-VEN-001', category: 'Ventilator', status: 'OPERATIONAL' }, { headers });
    console.log('EQUIPMENT CREATE OK:', eq.data.id.slice(0, 8));
    const eqDel = await axios.delete(`${BASE}/api/helpdesk/equipment/${eq.data.id}`, { headers });
    console.log('EQUIPMENT DELETE OK:', eqDel.data.ok);

    const cat = cats.data.find(c => c.type === 'INTERNAL');
    const t = await axios.post(`${BASE}/api/helpdesk/tickets`, { categoryId: cat.id, subject: 'E2E Integration Smoke Ticket', description: 'Automated integration verification', priority: cat.default_priority, channel: 'INTERNAL' }, { headers });
    const ticketId = t.data.id;
    console.log('TICKET CREATE OK:', t.data.ticket_no, 'priority', t.data.priority, 'sla_due', t.data.sla_due_at);

    const note = await axios.post(`${BASE}/api/helpdesk/tickets/${ticketId}/notes`, { body: 'E2E note from integration test', isInternal: true }, { headers });
    console.log('NOTE ADD OK:', note.data.id.slice(0, 8));

    const detail = await axios.get(`${BASE}/api/helpdesk/tickets/${ticketId}`, { headers });
    console.log('TICKET DETAIL OK: notes', detail.data.notes.length, 'sla_status', detail.data.sla_status, 'escalations', detail.data.escalations.length);

    const esc = await axios.post(`${BASE}/api/helpdesk/tickets/${ticketId}/escalate`, { reason: 'E2E escalation test' }, { headers });
    console.log('ESCALATE OK: level now', esc.data.escalation_level);

    const list = await axios.get(`${BASE}/api/helpdesk/tickets?status=OPEN`, { headers });
    console.log('TICKET LIST OK:', list.data.length, 'open tickets');

    const patch = await axios.patch(`${BASE}/api/helpdesk/tickets/${ticketId}`, { status: 'RESOLVED', note: 'E2E resolution note' }, { headers });
    console.log('PATCH OK: status', patch.data.status);

    await axios.delete(`${BASE}/api/helpdesk/tickets/${ticketId}`).catch(() => {});
    const finalAnalytics = await axios.get(`${BASE}/api/helpdesk/analytics`, { headers });
    console.log('FINAL ANALYTICS OK: total', finalAnalytics.data.kpi.total_tickets);
    console.log('\nALL E2E CHECKS PASSED');
  } catch (e) {
    console.error('E2E FAILED:', e.response ? `${e.response.status} ${JSON.stringify(e.response.data)}` : e.message);
  }
})();
