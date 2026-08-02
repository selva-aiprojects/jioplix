const express = require("express");
const router = express.Router();

// In-memory mock database store for reminders with fallback seed data
let remindersDb = [
  {
    id: "REM-1001",
    patientId: "P-10024",
    patientName: "John Doe",
    phone: "+91 98765 43210",
    type: "OPD_FOLLOWUP",
    appointmentDate: "2026-08-04",
    scheduledTime: "10:30 AM",
    doctorName: "Dr. Sarah Jenkins",
    department: "Cardiology",
    status: "SCHEDULED", // SCHEDULED, SENT, DELIVERED, FAILED
    whatsappTemplate: "opd_followup_reminder",
    lastSentAt: null,
    messageBody: "Dear John Doe, this is a reminder for your OPD follow-up consultation with Dr. Sarah Jenkins on 2026-08-04 at 10:30 AM at Jioplix Health. Please reply YES to confirm.",
    logs: [
      { timestamp: new Date(Date.now() - 3600000).toISOString(), status: "SCHEDULED", note: "Auto-scheduled after consultation completion" }
    ]
  },
  {
    id: "REM-1002",
    patientId: "P-10088",
    patientName: "Anita Sharma",
    phone: "+91 91234 56789",
    type: "LAB_RESULT_READY",
    appointmentDate: "2026-08-02",
    scheduledTime: "02:00 PM",
    doctorName: "Dr. Rajesh Gupta",
    department: "Pathology",
    status: "DELIVERED",
    whatsappTemplate: "lab_report_notification",
    lastSentAt: new Date(Date.now() - 14400000).toISOString(),
    messageBody: "Dear Anita Sharma, your Blood Profile lab report is now ready. Download securely from your Jioplix portal.",
    logs: [
      { timestamp: new Date(Date.now() - 15000000).toISOString(), status: "SENT", note: "WhatsApp API payload dispatched" },
      { timestamp: new Date(Date.now() - 14400000).toISOString(), status: "DELIVERED", note: "WhatsApp double tick webhook confirmed" }
    ]
  },
  {
    id: "REM-1003",
    patientId: "P-10112",
    patientName: "Robert Vance",
    phone: "+91 99887 76655",
    type: "MEDICATION_REFILL",
    appointmentDate: "2026-08-03",
    scheduledTime: "09:00 AM",
    doctorName: "Dr. Emily Smith",
    department: "Endocrinology",
    status: "SENT",
    whatsappTemplate: "med_refill_prompt",
    lastSentAt: new Date(Date.now() - 7200000).toISOString(),
    messageBody: "Hi Robert, your Insulin glargine prescription is due for refill. Tap link to reorder from Jioplix Pharmacy.",
    logs: [
      { timestamp: new Date(Date.now() - 7200000).toISOString(), status: "SENT", note: "Dispatched via Meta WhatsApp Cloud API" }
    ]
  },
  {
    id: "REM-1004",
    patientId: "P-10145",
    patientName: "Priya Sundaram",
    phone: "+91 94433 22110",
    type: "IPD_DISCHARGE_CARE",
    appointmentDate: "2026-08-05",
    scheduledTime: "11:00 AM",
    doctorName: "Dr. Alok Verma",
    department: "Orthopedics",
    status: "FAILED",
    whatsappTemplate: "post_discharge_checkin",
    lastSentAt: new Date(Date.now() - 3600000).toISOString(),
    messageBody: "Hello Priya, how is your post-op leg rehabilitation progress? Please rate your pain level 1-10.",
    logs: [
      { timestamp: new Date(Date.now() - 3600000).toISOString(), status: "FAILED", note: "Error 131026: Recipient phone not registered on WhatsApp" }
    ]
  }
];

// GET /api/reminders - List reminders with optional query filters
router.get("/", (req, res) => {
  const { status, type, search } = req.query;
  let result = [...remindersDb];

  if (status && status !== "ALL") {
    result = result.filter(r => r.status === status);
  }
  if (type && type !== "ALL") {
    result = result.filter(r => r.type === type);
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(r =>
      r.patientName.toLowerCase().includes(q) ||
      r.patientId.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.doctorName.toLowerCase().includes(q)
    );
  }

  res.json({
    success: true,
    total: result.length,
    reminders: result
  });
});

// GET /api/reminders/stats - Executive summary metrics
router.get("/stats", (req, res) => {
  const total = remindersDb.length;
  const sent = remindersDb.filter(r => r.status === "SENT" || r.status === "DELIVERED").length;
  const scheduled = remindersDb.filter(r => r.status === "SCHEDULED").length;
  const failed = remindersDb.filter(r => r.status === "FAILED").length;
  const deliveryRate = total > 0 ? Math.round((sent / total) * 100) : 100;

  res.json({
    success: true,
    stats: {
      total,
      sent,
      scheduled,
      failed,
      deliveryRate
    }
  });
});

// POST /api/reminders/send - Trigger instant sending of WhatsApp reminder
router.post("/send", (req, res) => {
  const { reminderId } = req.body;
  const item = remindersDb.find(r => r.id === reminderId);
  if (!item) {
    return res.status(404).json({ success: false, error: "Reminder not found" });
  }

  item.status = "SENT";
  item.lastSentAt = new Date().toISOString();
  item.logs.push({
    timestamp: item.lastSentAt,
    status: "SENT",
    note: "Manual dispatch via WhatsApp API initiated by Executive center"
  });

  res.json({
    success: true,
    message: `WhatsApp reminder dispatched successfully to ${item.patientName} (${item.phone})`,
    reminder: item
  });
});

// POST /api/reminders - Create a new follow-up reminder
router.post("/", (req, res) => {
  const { patientId, patientName, phone, type, appointmentDate, scheduledTime, doctorName, department, messageBody } = req.body;
  if (!patientName || !phone) {
    return res.status(400).json({ success: false, error: "patientName and phone are required" });
  }

  const newReminder = {
    id: `REM-${Math.floor(1000 + Math.random() * 9000)}`,
    patientId: patientId || `P-${Math.floor(10000 + Math.random() * 90000)}`,
    patientName,
    phone,
    type: type || "OPD_FOLLOWUP",
    appointmentDate: appointmentDate || new Date().toISOString().split("T")[0],
    scheduledTime: scheduledTime || "10:00 AM",
    doctorName: doctorName || "Attending Physician",
    department: department || "General Medicine",
    status: "SCHEDULED",
    whatsappTemplate: "opd_followup_reminder",
    lastSentAt: null,
    messageBody: messageBody || `Dear ${patientName}, your appointment is scheduled for ${appointmentDate || 'today'}.`,
    logs: [
      { timestamp: new Date().toISOString(), status: "SCHEDULED", note: "Reminder created manually" }
    ]
  };

  remindersDb.unshift(newReminder);

  res.status(201).json({
    success: true,
    message: "Follow-up reminder created successfully",
    reminder: newReminder
  });
});

module.exports = router;
