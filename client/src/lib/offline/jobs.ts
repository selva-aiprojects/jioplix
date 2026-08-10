import axios from "axios";
import { idb } from "./db";
import { API_BASE_URL as API_BASE } from "../../config/api";

// ─── Offline job handlers ─────────────────────────────────────────────────────
// Multi-step offline flows (e.g. register patient, then create the encounter)
// are stored as jobs in the outbox. Only serializable params are persisted;
// the actual API calls live in these handlers and replay in order on flush.
// Headers are captured at enqueue time so replays carry the exact tenant/auth
// the user had when the action was taken.

export interface OfflineJob {
  id: string;
  kind: "job";
  type: string;
  params: any;
  createdAt: number;
  attempts: number;
}

export type JobHandler = (params: any, ctx: { axios: typeof axios; API_BASE: string }) => Promise<void>;

const jobHandlers = new Map<string, JobHandler>();

export function registerJobHandler(type: string, handler: JobHandler) {
  jobHandlers.set(type, handler);
}

/**
 * REGISTER-PATIENT: creates the patient then the OPD encounter. On retry, if
 * the patient was already created on a previous attempt (response lost before
 * the encounter step ran), it reuses the existing patient by phone instead of
 * creating a duplicate.
 */
registerJobHandler("register-patient", async (params, ctx) => {
  const { axios: ax, API_BASE: base } = ctx;
  const h = params.headers || {};
  const patientPayload = params.patient;
  const encounterPayload = params.encounter;

  let patientId = params.localPatientId || null;
  if (!patientId) {
    try {
      const search = await ax.get(`${base}/api/patients?search=${encodeURIComponent(patientPayload.phone)}`, {
        headers: h,
        timeout: 20000,
      });
      const list = Array.isArray(search.data) ? search.data : Array.isArray(search.data?.data) ? search.data.data : [];
      const existing = list.find((p: any) => String(p.phone) === String(patientPayload.phone));
      if (existing) patientId = existing.id;
    } catch {
      /* fall through to create */
    }
  }

  if (!patientId) {
    const pRes = await ax.post(`${base}/api/patients`, patientPayload, { headers: h, timeout: 20000 });
    patientId = pRes.data?.id || (Array.isArray(pRes.data) ? pRes.data[0]?.id : null);
    if (!patientId) throw new Error("Patient registration returned an unexpected response.");
  }

  const encRes = await ax.post(`${base}/api/hospital/encounters`, { ...encounterPayload, patientId }, { headers: h, timeout: 20000 });
  if (!(encRes.data?.id || encRes.data?.encounterId)) {
    throw new Error("Encounter creation returned an unexpected response.");
  }
});

export async function runJob(job: OfflineJob): Promise<void> {
  const handler = jobHandlers.get(job.type);
  if (!handler) {
    // Unknown job type — drop it to avoid an infinite retry loop
    await idb.del("outbox", job.id);
    return;
  }
  await handler(job.params, { axios, API_BASE });
}
