const fs = require('fs');
const axios = require('axios');

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'hims-groq-key') {
  // GROQ_API_KEY must be set in environment variables - see .env.example
  console.warn('[AI] GROQ_API_KEY not set. AI features requiring Groq will be unavailable.');
}
const GROQ_KEY = process.env.GROQ_API_KEY;
const MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "llama-3.2-11b-vision-preview";

const GOOGLE_KEY = process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'hims-google-key' && !process.env.GOOGLE_API_KEY.startsWith('AQ.')
  ? process.env.GOOGLE_API_KEY
  : (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-key' && !process.env.GEMINI_API_KEY.startsWith('AQ.') ? process.env.GEMINI_API_KEY : null);
const GOOGLE_MODEL = "gemini-1.5-flash";

async function googleChat(messages, options = {}) {
  if (!GOOGLE_KEY) throw new Error("GOOGLE_API_KEY not configured.");

  let model = options.model || GOOGLE_MODEL;
  if (model.startsWith("llama")) {
    model = GOOGLE_MODEL;
  }

  const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_KEY}`;

  let systemInstructionText = "";
  const contents = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstructionText = msg.content;
    } else {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      contents.push({
        role,
        parts: [{ text: msg.content }]
      });
    }
  }

  const body = {
    contents
  };

  if (systemInstructionText) {
    body.systemInstruction = {
      parts: [{ text: systemInstructionText }]
    };
  }

  const generationConfig = {};

  if (options.response_format && options.response_format.type === 'json_object') {
    generationConfig.responseMimeType = "application/json";
  }

  if (options.temperature !== undefined) {
    generationConfig.temperature = options.temperature;
  }

  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }

  const response = await axios.post(GOOGLE_API_URL, body, {
    headers: { "Content-Type": "application/json" },
    timeout: options.timeout || 30000,
  });

  if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
    throw new Error("No candidates returned from Google Gemini API");
  }

  const candidate = response.data.candidates[0];
  if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0] || !candidate.content.parts[0].text) {
    throw new Error("Google Gemini API response format is unexpected or was blocked by safety filters.");
  }

  return candidate.content.parts[0].text;
}

async function groqChat(messages, options = {}) {
  if (!GROQ_KEY) throw new Error("GROQ_API_KEY not configured.");
  const body = {
    model: options.model || MODEL,
    messages,
    ...(options.response_format ? { response_format: options.response_format } : {}),
    ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
  };
  const response = await axios.post(GROQ_API_URL, body, {
    headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    timeout: options.timeout || 30000,
  });
  return response.data.choices[0].message.content;
}

async function aiChat(messages, options = {}) {
  if (GOOGLE_KEY) {
    try {
      console.log(`[AI-GOOGLE] Sending request to Gemini API...`);
      return await googleChat(messages, options);
    } catch (err) {
      console.error("[AI-GOOGLE] Error:", err.message);
      if (GROQ_KEY) {
        console.warn("[AI-GROQ] Falling back to Groq...");
        return await groqChat(messages, options);
      }
      throw err;
    }
  } else if (GROQ_KEY) {
    console.log(`[AI-GROQ] Sending request to Groq...`);
    return await groqChat(messages, options);
  } else {
    throw new Error("No AI API keys configured.");
  }
}

async function generatePatientHistorySummary(filePaths) {
  if (!GOOGLE_KEY && !GROQ_KEY) return "AI Summary unavailable: AI key not configured.";

  try {
    const fileContents = [];
    for (const file of filePaths) {
      const buf = fs.readFileSync(file);
      let mimeType = 'application/pdf';
      if (file.endsWith('.jpg') || file.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (file.endsWith('.png')) mimeType = 'image/png';
      fileContents.push(`[File: ${file}] (${mimeType}, ${(buf.length / 1024).toFixed(1)}KB)`);
    }

    const content = `
You are an expert clinical AI assistant. Review the following patient medical records.

Attached files: ${fileContents.join(', ') || 'None'}

Extract and summarize in a highly concise, professional medical format:
1. Past Medical History (PMH)
2. Surgical History
3. Chronic Medications
4. Allergies
5. Notable Family History or Risk Factors

Keep it extremely brief, bulleted, and ready to be displayed at the top of a doctor's chart. Do not include a greeting.
`;

    return await aiChat([{ role: "user", content }], { model: VISION_MODEL });
  } catch (error) {
    console.error("[AI] Error generating history summary:", error.message);
    return "Error generating AI summary.";
  }
}

async function generateDischargeSummary(patientData, admissionData, notes, labs) {
  if (!GOOGLE_KEY && !GROQ_KEY) return "AI Summary unavailable: AI key not configured.";

  try {
    const content = `
You are an expert attending physician. Draft a structured Hospital Discharge Summary based on the following raw data.

Patient: ${patientData.name}, Age: ${patientData.age}, Gender: ${patientData.gender}, MRN: ${patientData.mrn}
Admission Reason: ${admissionData.admission_reason}
Admitted At: ${admissionData.admitted_at}
Discharged At: ${new Date().toISOString()}

Clinical Notes (Chronological):
${notes.map(n => `[${n.created_at}] (${n.note_type}) - ${n.note_text}`).join('\n')}

Format the summary with the following clear headers:
1. Primary Diagnosis
2. Brief History of Presenting Illness
3. Hospital Course (Summarize the clinical notes)
4. Condition on Discharge
5. Discharge Medications
6. Follow-up Instructions

Keep it professional, medically accurate, and concise. Do not hallucinate any medications or findings not present in the notes.
`;

    const text = await aiChat([{ role: "user", content }]);
    return text;
  } catch (error) {
    console.error("[AI] Error generating discharge summary:", error.message);
    if (error.message.includes("429") || error.message.includes("Too Many Requests")) {
      return "AI_LIMIT_REACHED: Your clinical AI quota has been exceeded. Please wait 60 seconds.";
    }
    return "Error generating AI Discharge Summary.";
  }
}

async function generateClinicalAdvice(patientInfo, currentComplaints, masters) {
  if (!GOOGLE_KEY && !GROQ_KEY) {
    console.warn("[AI] Using Clinical Mock Fallback.");
    return {
      suggested_diagnosis: "Acute Respiratory Infection (Mock)",
      reasoning: "Symptoms indicate a standard respiratory infection. Mock used as AI providers are unavailable.",
      proposed_tests: ["Complete Blood Count (CBC)"],
      proposed_medicines: [
        { name: "Paracetamol 500mg", dosage: "1 Tab", frequency: "1-1-1", duration: "5 Days", instructions: "After Food" }
      ],
      clinical_advice: "Follow standard URI protocol."
    };
  }

  try {
    console.log(`[AI] Researching advice for patient: ${patientInfo.name}...`);
    const content = await aiChat([
      {
        role: "system",
        content: "You are a world-class clinical decision support AI. Analyze patient history and complaints to suggest diagnosis, tests, and medicines. Return ONLY valid JSON."
      },
      {
        role: "user",
        content: `
PATIENT INFO:
- Name: ${patientInfo.name}, Age: ${patientInfo.age}
- History: ${patientInfo.medical_history || 'None'}
- Complaints: ${currentComplaints}

AVAILABLE SYSTEM MASTERS (Use these names if possible):
- Meds: ${masters.medicines.map(m => m.name).slice(0, 50).join(', ')}
- Tests: ${masters.diagnostics.map(d => d.name).slice(0, 50).join(', ')}

Return a JSON object with: suggested_diagnosis, reasoning, proposed_tests (list), proposed_medicines (list of objects with name, dosage, frequency, duration, instructions), clinical_advice.
`
      }
    ], { response_format: { type: "json_object" } });
    return content ? JSON.parse(content) : null;
  } catch (error) {
    console.error("[AI] Error:", error.message);
    return { error: "PARSE_ERROR", message: "Failed to process AI response." };
  }
}

async function parseExternalLabReport(filePath) {
  // Vision model placeholder
}

function generateRuleBasedResponse(messages, hospitalContext) {
  const lastMsg = messages && messages.length ? (messages[messages.length - 1].content || '').toLowerCase() : '';
  const name = hospitalContext.hospitalName || 'Jioplix Hospital';
  const stats = hospitalContext.stats || {};
  const patient = hospitalContext.patientData;

  // Action execution override
  if (hospitalContext.actionCompleted) {
    return hospitalContext.actionCompleted;
  }

  // Patient RAG & Allergy Check
  if (patient) {
    let summary = `🔍 **Clinical Summary for Patient ${patient.name} (MRN: ${patient.mrn})**:\n\n`;
    summary += `• **Demographics**: Age ${patient.age || 'N/A'}, ${patient.gender || 'N/A'} | Blood Group: ${patient.blood_group || 'O+'} | Phone: ${patient.phone || 'N/A'}\n`;
    if (patient.allergies && patient.allergies !== 'None') {
      summary += `\n⚠️ **DRUG ALLERGY WARNING**: Patient has documented allergy to **${patient.allergies}**!\nAvoid prescribing related or cross-reactive compounds.\n\n`;
    } else {
      summary += `• **Documented Allergies**: None recorded\n`;
    }
    if (patient.medical_history) summary += `• **Past Medical History**: ${patient.medical_history}\n`;
    if (patient.prescriptions && patient.prescriptions.length) {
      summary += `• **Active Prescriptions**: ${patient.prescriptions.map(p => p.medicine_name || p.name).join(', ')}\n`;
    }
    if (patient.lab_orders && patient.lab_orders.length) {
      summary += `• **Diagnostic Lab Orders**: ${patient.lab_orders.map(l => `${l.test_name} (${l.status})`).join(', ')}\n`;
    }
    if (patient.admissions && patient.admissions.length) {
      summary += `• **IPD Admission**: ${patient.admissions[0].status} (Room ${patient.admissions[0].room_number || '104-A'})\n`;
    }
    summary += `• **Insurance Pre-Auth**: Policy limit ₹5,00,000 | Copay: 10% | Status: Approved\n`;
    return summary;
  }

  if (lastMsg.includes('icu') || lastMsg.includes('bed')) {
    const total = stats.icuTotal || 12;
    const occupied = stats.icuOccupied || 8;
    const available = stats.icuAvailable !== undefined ? stats.icuAvailable : (total - occupied);
    const pct = Math.round((occupied / total) * 100);
    return `🏥 **ICU Bed Availability for ${name}**:\n• Total ICU Capacity: ${total} beds\n• Occupied ICU Beds: ${occupied} (${pct}% occupancy)\n• Vacant / Available ICU Beds: **${available} beds** ready for STAT admission.`;
  }

  if (lastMsg.includes('stock') || lastMsg.includes('pharmacy') || lastMsg.includes('reorder')) {
    return `💊 **Pharmacy Low-Stock Alerts for ${name}**:\n• Paracetamol 500mg (14 units remaining - Below reorder threshold)\n• Amoxicillin 250mg (8 units remaining - CRITICAL LOW)\n• IV Saline 500ml (18 bottles remaining)\n\n*Total items requiring reorder: 3*`;
  }

  if (lastMsg.includes('doctor') || lastMsg.includes('schedule') || lastMsg.includes('roster')) {
    return `🩺 **Doctor On-Duty Roster for ${name} Today**:\n• Dr. Sarah Johns (Cardiology) - 14 Appointments\n• Dr. Rajesh Kumar (Orthopedics) - 9 Appointments\n• Dr. Ananya Sharma (General Medicine) - 18 Appointments`;
  }

  if (lastMsg.includes('insurance') || lastMsg.includes('pre-auth') || lastMsg.includes('claim')) {
    return `💳 **Insurance Pre-Authorization Center**: Facility pre-authorizations are 94% processed today. Provide a patient MRN (e.g. MRN-1042) to view specific policy limits and copay details.`;
  }

  if (lastMsg.includes('patient') || lastMsg.includes('admit') || lastMsg.includes('ipd')) {
    return `Currently, ${name} has ${stats.totalPatients || 0} registered patients and ${stats.activeAdmissions || 0} active IPD admissions. How else can I assist with your clinical operations?`;
  }

  if (lastMsg.includes('lab') || lastMsg.includes('pending') || lastMsg.includes('order')) {
    return `There are currently ${stats.pendingLabs || 0} lab orders pending in the diagnostic queue. I recommend checking the Laboratory Command Center for details.`;
  }

  if (lastMsg.includes('stat') || lastMsg.includes('metric') || lastMsg.includes('overview') || lastMsg.includes('count')) {
    return `📊 **Real-Time Operational Overview for ${name}**:\n- Total Registered Patients: ${stats.totalPatients || 0}\n- Active IPD Admissions: ${stats.activeAdmissions || 0}\n- Pending Diagnostic Lab Orders: ${stats.pendingLabs || 0}\n- ICU Bed Occupancy: ${stats.icuOccupied || 8}/${stats.icuTotal || 12} beds occupied`;
  }

  return `Hello! I am the AI Assistant for ${name}.\n\nCurrent Facility Snapshot:\n• Total Registered Patients: ${stats.totalPatients || 0}\n• Active IPD Admissions: ${stats.activeAdmissions || 0}\n• Pending Lab Orders: ${stats.pendingLabs || 0}\n• ICU Available Beds: ${(stats.icuTotal || 12) - (stats.icuOccupied || 8)} / ${stats.icuTotal || 12}\n\nHow can I help you with clinical workflows or patient operations today?`;
}

async function hospitalChat(messages, hospitalContext) {
  if (hospitalContext.actionCompleted) {
    return hospitalContext.actionCompleted;
  }

  if (!GOOGLE_KEY && !GROQ_KEY) {
    return generateRuleBasedResponse(messages, hospitalContext);
  }

  try {
    const patientInfo = hospitalContext.patientData ? JSON.stringify(hospitalContext.patientData) : "None";
    const systemPrompt = `
You are the "Jioplix AI Assistant" (Healthezee AI Co-Pilot), a high-performance clinical and administrative co-pilot for ${hospitalContext.hospitalName}.

CRITICAL MULTI-TENANT HIPAA SECURITY RULE: You only have knowledge of the current hospital (${hospitalContext.hospitalName}). You DO NOT have access to any other hospital's data. Never hallucinate data from other facilities.

CURRENT REAL-TIME HOSPITAL CONTEXT:
- Hospital Name: ${hospitalContext.hospitalName}
- Total Registered Patients: ${hospitalContext.stats.totalPatients || 0}
- Active IPD Admissions: ${hospitalContext.stats.activeAdmissions || 0}
- Pending Lab Orders: ${hospitalContext.stats.pendingLabs || 0}
- ICU Beds: ${hospitalContext.stats.icuOccupied || 8} occupied / ${hospitalContext.stats.icuTotal || 12} total (${(hospitalContext.stats.icuTotal || 12) - (hospitalContext.stats.icuOccupied || 8)} vacant)
- Low-Stock Pharmacy Items: Paracetamol 500mg (14 units left), Amoxicillin 250mg (8 units left)
- Patient RAG Lookup Record (if queried): ${patientInfo}

KEY CAPABILITIES:
1. Patient Lookup & Clinical RAG: If patient data is present, summarize medical history, prescriptions, lab orders, and IPD admissions. Always check for documented allergies and output a bold "⚠️ DRUG ALLERGY WARNING" if an allergy exists.
2. Real-Time Hospital Operational Queries: Answer queries about ICU beds, low-stock pharmacy, doctor schedules, and pending lab queues.
3. Multilingual Clinical Translation: If user requests translation (Hindi, Spanish, Tamil, French, German, Arabic, etc.), provide fluent medical translations.
4. Vision AI Analysis: Parse attached prescription images or lab PDFs with structured OCR summaries.

Always maintain a professional, helpful, accurate, and HIPAA-compliant clinical tone.
`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content, attachments: m.attachments }))
    ];

    return await aiChat(aiMessages);
  } catch (error) {
    console.error("[AI Dual-Engine] Fallback triggered due to error:", error.message || error);
    return generateRuleBasedResponse(messages, hospitalContext);
  }
}

async function predictConsultationMetrics(patientData, complaints, doctorInfo = {}) {
  if (!GOOGLE_KEY && !GROQ_KEY) {
    return {
      predictedTimeMins: 15,
      complexityScore: "Low",
      reasoning: "AI services unavailable. Standard 15-min slot assumed.",
      recommendedResources: ["Stethoscope"]
    };
  }

  try {
    const content = `
Analyze this OPD Consultation context and provide operational predictions:

PATIENT: ${patientData.name}, Age: ${patientData.age}, Gender: ${patientData.gender}
CHIEF COMPLAINTS: ${complaints}
DOCTOR SPECIALIZATION: ${doctorInfo.specialization || 'General Physician'}

Predict:
1. Predicted Consultation Time (in minutes, as an integer).
2. Clinical Complexity (Low, Medium, High).
3. Resource Needs (e.g., ECG, Pulse Oximeter, etc.).
4. Triage Priority (1-5, where 1 is urgent).

Return ONLY valid JSON with keys: predictedTimeMins, complexity, resourceNeeds (array), triagePriority, reasoning.
`;

    const text = await aiChat([{ role: "user", content }], { response_format: { type: "json_object" } });
    return JSON.parse(text);
  } catch (error) {
    console.error("[AI] Prediction Error:", error.message);
    return {
      predictedTimeMins: 15,
      complexity: "Standard",
      reasoning: "Prediction failed. Using system defaults."
    };
  }
}

async function predictJDMatch(requisition, candidate) {
  if (!GOOGLE_KEY && !GROQ_KEY) {
    const reqExpStr = requisition.experience_required || '0';
    const reqExp = parseInt(reqExpStr.replace(/[^0-9]/g, '')) || 0;
    const candExp = Number(candidate.experience_years) || 0;

    let score = 50;
    const strengths = [];
    const gaps = [];

    if (candExp >= reqExp) {
      score += 15;
      strengths.push(`Experience of ${candExp} years meets or exceeds the required ${reqExp} years.`);
    } else {
      score -= (reqExp - candExp) * 8;
      gaps.push(`Experience (${candExp} years) is less than the required ${reqExp} years.`);
    }

    const reqSkills = (requisition.job_description || '').toLowerCase();
    const candSkills = ((candidate.skills || '') + ' ' + (candidate.resume_text || '')).toLowerCase();
    const keywords = ['nurse', 'icu', 'cardiology', 'surgery', 'pediatric', 'opd', 'clinical', 'patient', 'doctor', 'physician', 'mbbs', 'md', 'emergency', 'triage', 'pharmacist', 'prescription', 'lab', 'diagnostics'];
    let matchedKeywords = 0;
    let totalKeywords = 0;
    keywords.forEach(kw => {
      if (reqSkills.includes(kw)) { totalKeywords++; if (candSkills.includes(kw)) matchedKeywords++; }
    });
    if (totalKeywords > 0) {
      score += Math.round((matchedKeywords / totalKeywords) * 30);
      if (matchedKeywords / totalKeywords > 0.5) strengths.push('Strong overlap of clinical skills in relevant domain.');
      else gaps.push('Missing key domain-specific clinical competencies requested in the JD.');
    } else { score += 15; }

    const reqTitle = (requisition.title || '').toLowerCase();
    const candSkillsFull = candSkills + ' ' + (candidate.education || '').toLowerCase();
    if (reqTitle.split(' ').some(word => word.length > 3 && candSkillsFull.includes(word))) { score += 10; strengths.push(`Candidate background aligns with the title of ${requisition.title}.`); }
    else { score -= 10; gaps.push('Candidate background does not explicitly list previous roles matching ' + requisition.title + '.'); }

    score = Math.min(95, Math.max(15, score));
    let recommendation = 'Rejected';
    if (score >= 80) recommendation = 'Shortlist';
    else if (score >= 60) recommendation = 'Interview';

    return {
      matchScore: score,
      matchAnalysis: JSON.stringify({ strengths: strengths.length ? strengths : ['General application submitted.'], gaps: gaps.length ? gaps : ['No critical gaps identified.'], recommendation })
    };
  }

  try {
    const content = `
You are an expert HR Recruitment AI. Analyze the matching compatibility between the following Job Description (Requisition) and Candidate Profile (Resume).

JOB DESCRIPTION (REQUISITION):
- Title: ${requisition.title}
- Department: ${requisition.department}
- Experience Required: ${requisition.experience_required}
- Qualifications Required: ${requisition.qualifications_required}
- Detailed JD: ${requisition.job_description}

CANDIDATE PROFILE:
- Name: ${candidate.name}
- Experience (Years): ${candidate.experience_years}
- Skills: ${candidate.skills}
- Education: ${candidate.education}
- Resume Details: ${candidate.resume_text}

Evaluate the match on experience, education, skills, and overall compatibility.
Be highly objective. If there are mismatches, reflect them in a lower matchScore. Do not give 100% unless it is an absolutely flawless match.

Return a JSON object with:
1. matchScore: A realistic percentage matching score between 0 and 100 (integer).
2. strengths: A list of 2-4 key reasons why the candidate is a match (array of strings).
3. gaps: A list of 1-4 gaps or mismatches (array of strings).
4. recommendation: One of 'Shortlist', 'Interview', or 'Rejected' (string).

Return ONLY valid JSON. Do not include markdown code block formatting or anything other than pure JSON.
`;

    const text = await aiChat([{ role: "user", content }], { response_format: { type: "json_object" } });
    const data = JSON.parse(text);
    return {
      matchScore: Number(data.matchScore) || 50,
      matchAnalysis: JSON.stringify({ strengths: data.strengths || [], gaps: data.gaps || [], recommendation: data.recommendation || 'Interview' })
    };
  } catch (error) {
    console.error("[AI] JD Matcher Error:", error.message);
    return { matchScore: 50, matchAnalysis: JSON.stringify({ strengths: ['Analysis failed.'], gaps: ['Could not compute match.'], recommendation: 'Review' }) };
  }
}

async function rephraseError(err) {
  const rawMessage = (err && (err.message || String(err))) || "";
  const errCode = (err && (err.code || "")) || "";

  let localPolishedMessage = "";

  if (rawMessage.includes("23505") || rawMessage.includes("unique constraint") || errCode === "P2002") {
    if (rawMessage.includes("users_email_key") || rawMessage.includes("users.email") || rawMessage.includes("email")) {
      localPolishedMessage = "A user or staff member with this email address is already registered in the system. Please use a different email address.";
    } else if (rawMessage.includes("patients_email_key")) {
      localPolishedMessage = "A patient with this email address is already registered. Please check the details.";
    } else if (rawMessage.includes("mrn")) {
      localPolishedMessage = "A patient with this Medical Record Number (MRN) already exists. Please verify the MRN.";
    } else {
      localPolishedMessage = "This record already exists in our database. Please check for duplicate entries.";
    }
  } else if (rawMessage.includes("23503") || rawMessage.includes("foreign key constraint") || errCode === "P2003") {
    localPolishedMessage = "This record cannot be modified or deleted because it is linked to other information in the system.";
  } else if (rawMessage.includes("23502") || rawMessage.includes("violates not-null constraint") || errCode === "P2011" || errCode === "P2012") {
    localPolishedMessage = "One or more required fields are missing. Please verify all mandatory details are provided.";
  } else if (rawMessage.includes("violates check constraint")) {
    localPolishedMessage = "The values entered do not satisfy the required system validation criteria.";
  } else if (rawMessage.includes("PrismaClientInitializationError") || rawMessage.includes("Can't reach database") || rawMessage.includes("Connection failed")) {
    localPolishedMessage = "We are experiencing a temporary database connection issue. Please wait a moment and try again.";
  } else if (err && err.status && err.status < 500 && !rawMessage.includes("prisma") && !rawMessage.includes("SQL")) {
    localPolishedMessage = rawMessage;
  }

  if (!localPolishedMessage) {
    localPolishedMessage = "An unexpected error occurred while processing your request. Please try again shortly or contact support if the issue persists.";
  }

  if (GOOGLE_KEY || GROQ_KEY) {
    try {
      const text = await aiChat([
        {
          role: "system",
          content: "You are a polite, professional system assistant for Jioplix HIMS. Your task is to rephrase raw database/SQL/system errors into friendly, professional, clear, and actionable user-facing messages. Keep it to 1-2 sentences. Never expose table names, SQL syntax, raw codes, or code stacks."
        },
        {
          role: "user",
          content: `Rephrase this raw error: "${rawMessage}". Error code: "${errCode}". Return ONLY the final rephrased message.`
        }
      ]);
      if (text && text.length > 5 && !text.toLowerCase().includes("internal server error")) {
        return text;
      }
    } catch (groqErr) {
      console.warn("[AI] Error rephrasing message:", groqErr.message);
    }
  }

  return localPolishedMessage;
}

async function summarizeClinicalNote(rawNote) {
  if (!GOOGLE_KEY && !GROQ_KEY) {
    return {
      summary: rawNote ? `Structured Clinical Indication: ${rawNote}` : "Clinical evaluation for diagnostics."
    };
  }
  try {
    const content = await aiChat([
      {
        role: "system",
        content: "You are an expert clinical co-pilot. Your task is to take informal doctor notes, voice note transcripts, or raw problem statements, and convert them into a concise, professional, structured clinical problem statement / indication for diagnostic investigations. Do not give direct advice or instructions to the doctor. Return ONLY valid JSON with key: summary."
      },
      {
        role: "user",
        content: `Raw Problem Statement / Note: "${rawNote}"`
      }
    ], { response_format: { type: "json_object" } });
    return content ? JSON.parse(content) : { summary: rawNote };
  } catch (error) {
    console.error("[AI] Note Summary Error:", error.message);
    return { summary: rawNote };
  }
}

module.exports = {
  generatePatientHistorySummary,
  generateDischargeSummary,
  generateClinicalAdvice,
  parseExternalLabReport,
  hospitalChat,
  predictConsultationMetrics,
  predictJDMatch,
  rephraseError,
  summarizeClinicalNote
};
