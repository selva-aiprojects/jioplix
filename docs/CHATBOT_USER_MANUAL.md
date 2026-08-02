# Jioplix AI Co-Pilot & ChatBot – End-User Operational Manual

Welcome to the **Jioplix AI Co-Pilot User Manual**. This document provides hospital staff, attending physicians, nurses, receptionists, and administrators with a comprehensive operational guide for using the **Jioplix AI Assistant**.

---

## 1. Executive Summary & Overview

The **Jioplix AI Co-Pilot** is an intelligent, real-time clinical and operational assistant embedded directly within your Jioplix HIMS application. Powered by advanced Retrieval-Augmented Generation (RAG) and Vision AI models, it enables hands-free voice control, automated patient record lookups, prescription vision scanning, drug safety checking, multilingual translation, and direct clinical action execution.

### Core Capabilities at a Glance
- 🏥 **Real-Time Operational Context**: ICU bed availability, low-stock pharmacy alerts, and doctor schedule rosters.
- 🔍 **Patient Lookup (RAG)**: Instant medical history summaries for any registered patient by MRN.
- ⚡ **Text-to-Action Execution**: Book OPD appointments and register STAT lab orders using simple chat commands.
- ⚠️ **Drug Allergy & Safety Warnings**: Automatic screening of patient allergies against requested prescriptions.
- 🌐 **Multilingual Clinical Translation**: Translate notes and discharge summaries into Hindi, Spanish, Tamil, French, German, Arabic, etc.
- 💳 **Insurance Pre-Authorization Queries**: Retrieve coverage limits, copay percentages, and pre-auth status.
- 📸 **Vision AI Prescription Parsing**: Upload images or PDFs of prescriptions/lab reports for instant OCR analysis.
- 🎤 **Hands-Free Voice Dictation & Text-to-Speech (TTS)**: Speak prompts aloud in doctor consultation rooms and listen to audio responses.

---

## 2. Widget Navigation & Interface Controls

The AI Assistant widget appears in the lower-right corner of your screen on all clinical pages:

- **Open / Close Widget**: Click the floating blue **MessageSquare** icon at the bottom-right of the screen.
- **Reposition Widget (Drag & Drop)**: Click and hold the purple `⠿ DRAG` handle bar at the top of the chat widget or floating button to drag it anywhere across your window. The widget will automatically remember your preferred screen position.
- **Quick Suggestion Chips**: Use the horizontal pill buttons below the chat header (`🏥 ICU Bed Status`, `💊 Low Stock Alerts`, `🩺 Doctor Schedules`, `🔍 MRN Patient Lookup`, etc.) for instant single-click queries.

---

## 3. Real-Time Operational Context Queries

You can ask the assistant about hospital metrics in natural language:

### ICU Bed Availability
- **Prompt**: `"How many ICU beds are available right now?"`
- **Output**: Returns total ICU beds, occupied count, vacant count, and occupancy percentage.

### Pharmacy Low-Stock Alerts
- **Prompt**: `"Show pharmacy low-stock alerts and items below reorder level."`
- **Output**: Lists essential medicines with stock quantity under 20 units and total low-stock count.

### Doctor Schedules & Duty Rosters
- **Prompt**: `"List doctor schedules and appointments for today."`
- **Output**: Shows registered doctors, specializations, departments, and appointment counts scheduled for today.

---

## 4. Patient Lookup (RAG Clinical Summarization)

To summarize a patient's clinical history without manually opening multiple charts, simply include their Medical Record Number (MRN) in your query.

### Recommended Prompts
- `"Summarize medical history for MRN-1042"`
- `"Show clinical timeline and past diagnoses for MRN-1089"`

### What the AI Retrieves & Summarizes
1. Demographics: Age, Gender, Blood Group, Phone Number.
2. Clinical History & Documented Allergies.
3. Recent Encounters & Consultations.
4. Active & Historical Prescriptions.
5. Pending & Completed Diagnostic Lab Orders.
6. IPD Admission Records.

---

## 5. Text-to-Action Execution Guide

Authorized staff can perform clinical actions directly from the chat window:

### A. Booking OPD Appointments
- **Format**: `"Book OPD appointment for MRN-[MRN_NUMBER] with Dr. [DOCTOR_NAME]"`
- **Example**: `"Book OPD appointment for MRN-1042 with Dr. Sarah Johns"`
- **Result**: Creates a scheduled appointment in the HIMS database and displays a confirmation badge (`✅ Action Completed`).

### B. Registering STAT Lab Orders
- **Format**: `"Order STAT [TEST_NAME] for MRN-[MRN_NUMBER]"`
- **Example**: `"Order STAT Complete Blood Count (CBC) for MRN-1042"`
- **Result**: Registers a priority lab order in the diagnostic queue for technicians.

---

## 6. Drug Allergy & Conflict Safety Warnings

When reviewing patient records or asking for medication suggestions, the AI automatically checks the patient's recorded allergies in `patients.allergies`.

- **Alert Example**: If patient MRN-1042 has a documented Penicillin allergy, the assistant automatically flags:
  ```markdown
  ⚠️ DRUG ALLERGY WARNING: Patient has documented allergy to Penicillin!
  Avoid prescribing Amoxicillin or Ampicillin.
  ```

---

## 7. Multilingual Clinical Translation

Translate clinical summaries, prescription instructions, or discharge advice for non-English speaking patients or family members.

### Recommended Prompts
- `"Translate medical summary for MRN-1042 into Hindi"`
- `"Translate discharge instructions for MRN-1089 into Spanish"`
- `"Translate this note into Tamil: Take 1 tablet after food twice daily"`

---

## 8. Insurance Pre-Authorization & Coverage Queries

Check insurance eligibility, remaining limits, and copay details directly from chat:

### Recommended Prompts
- `"Show insurance coverage details for MRN-1042"`
- `"Check pre-authorization status and copay percentage for MRN-1042"`

---

## 9. Vision AI Prescription Scan & File Attachments

Upload external prescriptions, handwritten clinical notes, or PDF lab reports for instant Vision AI analysis:

1. Click the **Paperclip (📎)** icon next to the chat input field.
2. Select an image file (`.png`, `.jpg`, `.jpeg`) or PDF document (`.pdf`).
3. View the attachment preview thumbnail.
4. Type an optional prompt (e.g., `"Extract prescribed medications and dosage from this scan"`) and click **Send**.
5. The AI Vision model (`Gemini Vision` / `Llama Vision`) parses the text and displays a structured summary.

---

## 10. Hands-Free Voice Commands (Web Speech API) & Audio Playback (TTS)

### Voice Dictation (Speech-to-Text)
1. Click the **Microphone (🎤)** button in the chat input bar.
2. The button will pulse in red, showing **"Listening..."**.
3. Speak your prompt clearly (e.g., *"Summarize medical history for MRN-1042"*).
4. Click the microphone button again or pause speaking to auto-populate the prompt.

### Audio Playback (Text-to-Speech / TTS)
- Below any assistant response bubble, click the **🔊 Listen** button to have the AI read the response aloud.
- Click **🔇 Stop** at any time to silence playback.

---

## 11. Prompt Cheat Sheet for Hospital Staff

| User Role | Useful Prompt Example | Expected Result |
| :--- | :--- | :--- |
| **Attending Physician** | `"Summarize medical history for MRN-1042"` | Full RAG clinical history & allergy check |
| **OPD Receptionist** | `"Book OPD appointment for MRN-1042 with Dr. Sarah"` | Creates scheduled appointment in HIMS |
| **Consulting Doctor** | `"Order STAT Complete Blood Count for MRN-1042"` | Registers STAT lab order in diagnostic queue |
| **Nurse / Ward Staff** | `"How many ICU beds are free right now?"` | Real-time ICU bed metrics & occupancy % |
| **Pharmacist** | `"Show pharmacy low-stock alerts"` | Lists medicines below reorder threshold |
| **Billing & Insurance Desk** | `"Show insurance coverage and copay for MRN-1042"` | Policy limit, remaining limit & copay % |
| **Clinical Assistant** | `"Translate discharge notes for MRN-1042 into Hindi"` | Accurate medical translation |

---

## 12. Security, Privacy & HIPAA Compliance Guidelines

- **Hospital Scope Isolation**: The Jioplix AI Assistant is strictly scoped to your tenant database. It cannot access data from other healthcare facilities.
- **HIPAA Compliance**: All patient lookups require a valid MRN. Patient data is encrypted in transit and at rest.
- **Clinical Verification**: AI decision support responses are intended to co-pilot clinical staff. Final medical diagnoses and prescriptions remain the sole responsibility of the licensed attending physician.

---

*Manual Version 2.0 • Last Updated: August 2026 • Jioplix Healthcare Information Management System (HIMS)*
