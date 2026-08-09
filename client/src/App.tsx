import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LoginPage from './modules/auth/LoginPage';
import LandingPage from './modules/auth/LandingPage';
import { applyTheme } from './config/theme';
import DashboardPage from './modules/tenant/dashboard/DashboardPage';
import MastersPage from './modules/tenant/masters/MastersPage';
import OPDRegistrationPage from './modules/tenant/opd/OPDRegistrationPage';
import OPDQueuePage from './modules/tenant/opd/OPDQueuePage';
import OPDConsultationPage from './modules/tenant/opd/OPDConsultationPage';
import PatientRegisterPage from './modules/tenant/opd/PatientRegisterPage';
import TenantAppointmentsPage from './modules/tenant/appointments/AppointmentsPage';
import ClinicalAnalyticsDashboard from './modules/tenant/analytics/ClinicalAnalyticsDashboard';
import HistoricalArchivesPage from './modules/tenant/dashboard/HistoricalArchivesPage';

import DoctorAvailabilityPage from './modules/tenant/appointments/DoctorAvailabilityPage';
import AdvancedDoctorAvailabilityPage from './modules/tenant/appointments/AdvancedDoctorAvailabilityPage';
import DoctorAvailabilitySchedule from './modules/tenant/appointments/DoctorAvailabilitySchedule';
import BookAppointment from './modules/tenant/appointments/BookAppointment';

import IPDBedMap from './modules/tenant/ipd/IPDBedMap';
import IPDAdmissionsList from './modules/tenant/ipd/IPDAdmissionsList';
import IPDPatientView from './modules/tenant/ipd/IPDPatientView';
import AdmissionDeskPage from './modules/tenant/ipd/AdmissionDeskPage';
import DischargeSummariesPage from './modules/tenant/ipd/DischargeSummariesPage';
import LabManagementPage from './modules/tenant/lab/LabManagementPage';
import LabBillingQueue from './modules/tenant/lab/LabBillingQueue';
import AILabAssistant from './modules/tenant/lab/AILabAssistant';
import PharmacyManagementPage from './modules/tenant/pharmacy/PharmacyManagementPage';
import PharmacyDashboard from './modules/tenant/pharmacy/PharmacyDashboard';
import InventoryList from './modules/tenant/pharmacy/InventoryList';
import PrescriptionQueue from './modules/tenant/pharmacy/PrescriptionQueue';
import StaffManagementPage from './modules/tenant/staff/StaffManagementPage';
import RecruitmentHubPage from './modules/tenant/staff/RecruitmentHubPage';
import PayrollPage from './modules/tenant/payroll/PayrollPage';
import HrmsPage from './modules/tenant/hrms/HrmsPage';
import AnalyticsPage from './modules/tenant/analytics/AnalyticsPage';
import ProcurementPage from './modules/tenant/procurement/ProcurementPage';
import CrmPage from './modules/tenant/crm/CrmPage';
import FinancePage from './modules/tenant/finance/FinancePage';
import InventoryPage from './modules/tenant/inventory/InventoryPage';
import BillingPage from './modules/billing/BillingPage';
import RoleGuard from './components/RoleGuard';
import PlanGateGuard from './components/PlanGateGuard';
import AppointmentsPage from './modules/appointments/AppointmentsPage';
import PatientsPage from './modules/patients/PatientsPage';
import NexusDashboardPage from './modules/nexus/NexusDashboardPage';
import TenantsListPage from './modules/nexus/TenantsListPage';
import NexusUsersPage from './modules/nexus/NexusUsersPage';
import NexusActivityPage from './modules/nexus/NexusActivityPage';
import NexusSettingsPage from './modules/nexus/NexusSettingsPage';
import TenantDetailsPage from './modules/nexus/TenantDetailsPage';
import ProvisionTenantPage from './modules/nexus/ProvisionTenantPage';
import SupportTicketsPage from './modules/tenant/support/SupportTicketsPage';
import HelpdeskPage from './modules/tenant/helpdesk/HelpdeskPage';
import NexusTicketingPage from './modules/nexus/NexusTicketingPage';
import NexusCommunicationPage from './modules/nexus/NexusCommunicationPage';
import NexusUtilizationPage from './modules/nexus/NexusUtilizationPage';
import InsurancePage from './modules/tenant/billing/InsurancePage';
import MessageBoardPage from './modules/tenant/communication/MessageBoardPage';
import MailManagementPage from './modules/tenant/communication/MailManagementPage';
import ReminderTrackerPage from './modules/tenant/communication/ReminderTrackerPage';
import { useEffect } from 'react';
import SettingsPage from './modules/tenant/SettingsPage';
import SecureConfigsPage from './modules/tenant/SecureConfigsPage';
import AIChatbot from './components/AIChatbot';

import RadiologyPage from './modules/tenant/RadiologyPage';
import OperationTheatrePage from './modules/tenant/OperationTheatrePage';
import BloodBankPage from './modules/tenant/BloodBankPage';
import FacilityManagementPage from './modules/tenant/FacilityManagementPage';
import PatientPortalPage from './modules/tenant/PatientPortalPage';
import MobilePreviewPortal from './modules/mobile_preview/MobilePreviewPortal';

// New Enterprise & Advanced Modules
import EmergencyPage from './modules/tenant/emergency/EmergencyPage';
import NursingPage from './modules/tenant/nursing/NursingPage';
import ICUPage from './modules/tenant/icu/ICUPage';
import MRDPage from './modules/tenant/mrd/MRDPage';
import EMRPage from './modules/tenant/emr/EMRPage';
import IntegrationHubPage from './modules/tenant/integration/IntegrationHubPage';
import InfectionControlPage from './modules/tenant/infection_control/InfectionControlPage';
import QualityPage from './modules/tenant/quality/QualityPage';
import CSSDPage from './modules/tenant/cssd/CSSDPage';
import DieteticsPage from './modules/tenant/dietetics/DieteticsPage';
import AmbulancePage from './modules/tenant/ambulance/AmbulancePage';
import MortuaryPage from './modules/tenant/mortuary/MortuaryPage';
import TelemedicinePage from './modules/tenant/telemedicine/TelemedicinePage';
import ReferralsPage from './modules/tenant/referrals/ReferralsPage';
import ConsentPage from './modules/tenant/consent/ConsentPage';
import AuditGovernancePage from './modules/tenant/audit_governance/AuditGovernancePage';
import ABDMHubPage from './modules/tenant/abdm_hub/ABDMHubPage';
import FHIRHL7Page from './modules/tenant/fhir_hl7/FHIRHL7Page';
import DICOMPACSPage from './modules/tenant/dicom_pacs/DICOMPACSPage';
import DeviceTelemetryPage from './modules/tenant/device_telemetry/DeviceTelemetryPage';

const RESERVED_SUBDOMAINS = ['dev', 'staging', 'stage', 'test', 'www', 'api', 'app', 'mail', 'admin', 'support', 'help', 'docs', 'status', 'uat', 'qa'];

function getTenantSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  if (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("::1")) return null;
  const parts = host.split(".");
  if (parts.length >= 3 && !parts[0].startsWith("www") && !RESERVED_SUBDOMAINS.includes(parts[0])) return parts[0];
  return null;
}

function TenantSecurityGuard() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentSub = getTenantSubdomain();
    const storedSub = localStorage.getItem("activeSubdomain");

    // 1. Cross-Tenant Subdomain Switch Protection:
    // If user switches host subdomain, immediately wipe all session data to eliminate cross-tenant leakage
    if (currentSub) {
      if (storedSub && storedSub !== currentSub) {
        console.warn(`[SECURITY_GUARD] Subdomain change detected (${storedSub} -> ${currentSub}). Purging session.`);
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem("activeSubdomain", currentSub);
        navigate('/login', { replace: true });
        return;
      }
      localStorage.setItem("activeSubdomain", currentSub);

      // 2. Token Claim & Role Validation
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            // Block Nexus tokens on tenant subdomains
            if (payload.type === 'nexus' || payload.role === 'nexus') {
              console.warn("[SECURITY_GUARD] Nexus token blocked on tenant subdomain. Purging session.");
              localStorage.clear();
              sessionStorage.clear();
              navigate('/login', { replace: true });
              return;
            }
          }
        } catch {
          localStorage.clear();
          sessionStorage.clear();
          navigate('/login', { replace: true });
          return;
        }
      }
    }
  }, [location.pathname, navigate]);

  return null;
}

function SubdomainObserver() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const sub = getTenantSubdomain();
    if (sub && location.pathname === '/') {
      navigate('/login', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}

function ThemeObserver() {
  const location = useLocation();
  useEffect(() => {
    applyTheme();
  }, [location.pathname]);
  return null;
}

function App() {
  // Apply saved theme on app load
  useEffect(() => {
    applyTheme();
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TenantSecurityGuard />
      <ThemeObserver />
      <SubdomainObserver />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Mobile Experience Portal */}
        <Route path="/mobile" element={<MobilePreviewPortal />} />

        {/* Tenant Routes */}
        <Route path="/tenant/dashboard" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Dashboard"><DashboardPage /></RoleGuard>} />
        <Route path="/tenant/analytics" element={<RoleGuard allowedRoles={['admin']} moduleName="Clinical Analytics"><ClinicalAnalyticsDashboard /></RoleGuard>} />
        <Route path="/tenant/reports" element={<RoleGuard allowedRoles={['admin']} moduleName="Reports"><ClinicalAnalyticsDashboard /></RoleGuard>} />
        <Route path="/tenant/masters" element={<RoleGuard allowedRoles={['admin']} moduleName="Hospital Settings"><MastersPage /></RoleGuard>} />
        <Route path="/tenant/opd/registration" element={<RoleGuard allowedRoles={['admin', 'receptionist']} moduleName="OPD Registration"><OPDRegistrationPage /></RoleGuard>} />
        <Route path="/tenant/opd/queue" element={<RoleGuard allowedRoles={['admin', 'doctor', 'receptionist', 'nurse']} moduleName="OPD Queue"><OPDQueuePage /></RoleGuard>} />
        <Route path="/tenant/opd/doctor-queue" element={<Navigate to="/tenant/opd/queue" replace />} />
        <Route path="/tenant/opd/consultation" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="Consultation Desk"><OPDConsultationPage /></RoleGuard>} />
        <Route path="/tenant/clinical/patient-register" element={<RoleGuard allowedRoles={['admin', 'receptionist', 'doctor', 'nurse']} moduleName="Patient Register"><PatientRegisterPage /></RoleGuard>} />
        <Route path="/tenant/appointments" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Appointments"><TenantAppointmentsPage /></RoleGuard>} />
        <Route path="/tenant/archives" element={<RoleGuard allowedRoles={['admin', 'doctor', 'staff', 'billing']} moduleName="Clinical & Financial Archives"><HistoricalArchivesPage /></RoleGuard>} />

        <Route path="/tenant/appointments/doctor-calendar" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Doctor Calendar"><DoctorAvailabilityPage /></RoleGuard>} />
        <Route path="/tenant/appointments/advanced-calendar" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Advanced Calendar"><AdvancedDoctorAvailabilityPage /></RoleGuard>} />
        <Route path="/tenant/appointments/schedule" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Schedule"><DoctorAvailabilitySchedule /></RoleGuard>} />
        <Route path="/tenant/appointments/book" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Book Appointment"><BookAppointment /></RoleGuard>} />

        <Route path="/tenant/ipd/beds" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="IPD Bed Map"><IPDBedMap /></RoleGuard>} />
        <Route path="/tenant/ipd/admissions" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="IPD Admissions"><IPDAdmissionsList /></RoleGuard>} />
        <Route path="/tenant/ipd/admissions/:id" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="IPD Patient View"><IPDPatientView /></RoleGuard>} />
        <Route path="/tenant/ipd/admission-desk" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="Admission Desk"><AdmissionDeskPage /></RoleGuard>} />
        <Route path="/tenant/ipd/discharge" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="Discharge Summaries"><DischargeSummariesPage /></RoleGuard>} />
        <Route path="/tenant/lab" element={<RoleGuard allowedRoles={['admin', 'lab_assistant', 'doctor', 'lab_tech']} moduleName="Laboratory"><LabManagementPage /></RoleGuard>} />
        <Route path="/tenant/lab/billing" element={<RoleGuard allowedRoles={['admin', 'receptionist', 'staff']} moduleName="Lab Billing"><LabBillingQueue /></RoleGuard>} />
        <Route path="/tenant/lab/ai" element={<RoleGuard allowedRoles={['admin', 'lab_assistant', 'doctor', 'lab_tech']} moduleName="AI Lab Assistant"><AILabAssistant /></RoleGuard>} />

        <Route path="/tenant/radiology" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist', 'lab_assistant', 'lab_tech', 'pharmacist']} moduleName="Radiology & Imaging"><RadiologyPage /></RoleGuard>} />
        <Route path="/tenant/ot" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist', 'lab_assistant', 'lab_tech', 'pharmacist']} moduleName="Operation Theatre"><OperationTheatrePage /></RoleGuard>} />
        <Route path="/tenant/blood-bank" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist', 'lab_assistant', 'lab_tech', 'pharmacist']} moduleName="Blood Bank"><BloodBankPage /></RoleGuard>} />
        <Route path="/tenant/facility" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist', 'lab_assistant', 'lab_tech', 'pharmacist']} moduleName="Facility Management"><FacilityManagementPage /></RoleGuard>} />
        <Route path="/tenant/patient-portal" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist', 'lab_assistant', 'lab_tech', 'pharmacist']} moduleName="Patient Portal"><PatientPortalPage /></RoleGuard>} />
        <Route path="/tenant/pharmacy" element={<RoleGuard allowedRoles={['admin', 'pharmacist', 'doctor']} moduleName="Pharmacy"><PharmacyManagementPage /></RoleGuard>} />
        <Route path="/tenant/pharmacy/dashboard" element={<RoleGuard allowedRoles={['admin', 'pharmacist']} moduleName="Pharmacy Dashboard"><PharmacyDashboard /></RoleGuard>} />
        <Route path="/tenant/pharmacy/inventory" element={<RoleGuard allowedRoles={['admin', 'pharmacist']} moduleName="Stock Inventory"><InventoryList /></RoleGuard>} />
        <Route path="/tenant/pharmacy/queue" element={<RoleGuard allowedRoles={['admin', 'pharmacist']} moduleName="Prescription Queue"><PrescriptionQueue /></RoleGuard>} />
        <Route path="/tenant/staff" element={<RoleGuard allowedRoles={['admin']} moduleName="Staff Management"><StaffManagementPage /></RoleGuard>} />
        <Route path="/tenant/payroll" element={<RoleGuard allowedRoles={['admin']} moduleName="Payroll"><PayrollPage /></RoleGuard>} />
        <Route path="/tenant/hrms" element={<RoleGuard allowedRoles={['admin', 'nurse', 'doctor']} moduleName="HRMS"><HrmsPage /></RoleGuard>} />
        <Route path="/tenant/analytics/ops" element={<RoleGuard allowedRoles={['admin', 'nurse', 'doctor']} moduleName="Operations Analytics"><AnalyticsPage /></RoleGuard>} />
        <Route path="/tenant/analytics/performance" element={<RoleGuard allowedRoles={['admin']} moduleName="Performance Insights"><AnalyticsPage /></RoleGuard>} />
        <Route path="/tenant/analytics/alerts" element={<RoleGuard allowedRoles={['admin', 'nurse']} moduleName="Alert Center"><AnalyticsPage /></RoleGuard>} />
        <Route path="/tenant/procurement" element={<RoleGuard allowedRoles={['admin', 'nurse']} moduleName="Procurement"><ProcurementPage /></RoleGuard>} />
        <Route path="/tenant/crm" element={<RoleGuard allowedRoles={['admin', 'receptionist', 'nurse']} moduleName="Patient CRM"><CrmPage /></RoleGuard>} />
        <Route path="/tenant/finance" element={<RoleGuard allowedRoles={['admin']} moduleName="Finance & Compliance"><FinancePage /></RoleGuard>} />
        <Route path="/tenant/inventory" element={<RoleGuard allowedRoles={['admin', 'pharmacist']} moduleName="Pharmacy Inventory"><InventoryPage /></RoleGuard>} />
        <Route path="/tenant/settings" element={<RoleGuard allowedRoles={['admin']} moduleName="Settings"><SettingsPage /></RoleGuard>} />
        <Route path="/tenant/settings/secure" element={<RoleGuard allowedRoles={['admin']} moduleName="Secure Configs"><SecureConfigsPage /></RoleGuard>} />
        <Route path="/tenant/support" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Support"><SupportTicketsPage /></RoleGuard>} />
        <Route path="/tenant/communication" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="Message Board"><MessageBoardPage /></RoleGuard>} />
        <Route path="/tenant/mail" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="Mail Management"><MailManagementPage /></RoleGuard>} />
        <Route path="/tenant/reminders" element={<RoleGuard allowedRoles={['admin', 'doctor', 'receptionist', 'nurse']} moduleName="Executive Follow-up"><ReminderTrackerPage /></RoleGuard>} />
        <Route path="/reminders" element={<Navigate to="/tenant/reminders" replace />} />
        <Route path="/tenant/support" element={<Navigate to="/tenant/support/tickets" replace />} />
        <Route path="/tenant/support/tickets" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Support"><SupportTicketsPage /></RoleGuard>} />
        <Route path="/tenant/helpdesk" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Helpdesk"><HelpdeskPage /></RoleGuard>} />
        <Route path="/billing" element={<RoleGuard allowedRoles={['admin', 'receptionist', 'staff', 'billing']} moduleName="Billing Desk"><BillingPage /></RoleGuard>} />
        <Route path="/appointments" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Appointments"><AppointmentsPage /></RoleGuard>} />
        <Route path="/patients" element={<RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="Patient Directory"><PatientsPage /></RoleGuard>} />
        
        {/* 20 Enterprise / Premium Subscription Restricted Module Routes */}
        <Route path="/tenant/emergency" element={<PlanGateGuard moduleName="Emergency / Casualty" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Emergency / Casualty"><EmergencyPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/nursing" element={<PlanGateGuard moduleName="Nursing Desk" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'nurse', 'doctor']} moduleName="Nursing Desk"><NursingPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/icu" element={<PlanGateGuard moduleName="ICU & Critical Care" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="ICU & Critical Care"><ICUPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/mrd" element={<PlanGateGuard moduleName="MRD & HIM" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'doctor', 'staff']} moduleName="MRD & HIM"><MRDPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/emr" element={<PlanGateGuard moduleName="EMR Documentation" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="EMR Documentation"><EMRPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/integration" element={<PlanGateGuard moduleName="Integration Hub" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin']} moduleName="Integration Hub"><IntegrationHubPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/infection-control" element={<PlanGateGuard moduleName="Infection Control" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="Infection Control"><InfectionControlPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/quality" element={<PlanGateGuard moduleName="Quality & Safety" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="Quality & Safety"><QualityPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/cssd" element={<PlanGateGuard moduleName="CSSD" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'nurse', 'staff']} moduleName="CSSD"><CSSDPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/dietetics" element={<PlanGateGuard moduleName="Diet & Nutrition" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'nurse', 'staff']} moduleName="Diet & Nutrition"><DieteticsPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/ambulance" element={<PlanGateGuard moduleName="Ambulance & Transport" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'receptionist', 'nurse']} moduleName="Ambulance & Transport"><AmbulancePage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/mortuary" element={<PlanGateGuard moduleName="Mortuary" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'staff']} moduleName="Mortuary"><MortuaryPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/telemedicine" element={<PlanGateGuard moduleName="Telemedicine" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Telemedicine"><TelemedicinePage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/referrals" element={<PlanGateGuard moduleName="Referral Management" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'doctor', 'receptionist']} moduleName="Referral Management"><ReferralsPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/consent" element={<PlanGateGuard moduleName="Consent Management" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']} moduleName="Consent Management"><ConsentPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/audit-governance" element={<PlanGateGuard moduleName="Audit & Governance" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin']} moduleName="Audit & Governance"><AuditGovernancePage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/abdm-hub" element={<PlanGateGuard moduleName="ABDM Gateway" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'doctor', 'receptionist']} moduleName="ABDM Gateway"><ABDMHubPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/fhir-hl7" element={<PlanGateGuard moduleName="FHIR & HL7 Layer" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin']} moduleName="FHIR & HL7 Layer"><FHIRHL7Page /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/dicom-pacs" element={<PlanGateGuard moduleName="DICOM & PACS Viewer" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'doctor', 'lab_tech']} moduleName="DICOM & PACS Viewer"><DICOMPACSPage /></RoleGuard></PlanGateGuard>} />
        <Route path="/tenant/device-telemetry" element={<PlanGateGuard moduleName="Medical Device IoT" requiredPlan="Enterprise / Premium"><RoleGuard allowedRoles={['admin', 'doctor', 'nurse']} moduleName="Medical Device IoT"><DeviceTelemetryPage /></RoleGuard></PlanGateGuard>} />
        
        {/* Nexus Routes */}
        <Route path="/nexus/dashboard" element={<NexusDashboardPage />} />
        <Route path="/nexus/tenants" element={<TenantsListPage />} />
        <Route path="/nexus/tenants/new" element={<ProvisionTenantPage />} />
        <Route path="/nexus/tenants/:id" element={<TenantDetailsPage />} />
        <Route path="/nexus/users" element={<NexusUsersPage />} />
        <Route path="/nexus/activity" element={<NexusActivityPage />} />
        <Route path="/nexus/tickets" element={<NexusTicketingPage />} />
        <Route path="/nexus/communications" element={<NexusCommunicationPage />} />
        <Route path="/nexus/utilization" element={<NexusUtilizationPage />} />
        <Route path="/nexus/settings" element={<NexusSettingsPage />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AIChatbot />
    </Router>
  );
}

export default App;
