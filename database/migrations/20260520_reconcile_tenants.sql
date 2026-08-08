-- Reconcile missing tables, functions, and triggers in tenant schemas
-- Use {schema} placeholder; runner replaces with actual schema name
SET search_path = {schema};

-- Ensure suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure medicines table (minimal columns used by pharmacy_inwards FK)
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255)
);

-- Ensure pharmacy_inwards
CREATE TABLE IF NOT EXISTS pharmacy_inwards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inward_no VARCHAR(50),
  supplier_id UUID REFERENCES suppliers(id),
  medicine_id UUID REFERENCES medicines(id),
  batch_number VARCHAR(100),
  invoice_number VARCHAR(100),
  quantity INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  uom VARCHAR(50),
  purchase_price NUMERIC DEFAULT 0,
  mrp NUMERIC DEFAULT 0,
  mfd_date DATE,
  expiry_date DATE,
  received_at TIMESTAMP DEFAULT NOW(),
  is_blocked BOOLEAN DEFAULT FALSE,
  remarks TEXT
);

-- Ensure doctor_availability
CREATE TABLE IF NOT EXISTS doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  recurring_pattern VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(doctor_id, date, start_time)
);

-- Ensure audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255) NOT NULL,
  resource_id UUID,
  details TEXT,
  ip_address INET,
  user_agent TEXT,
  risk_level VARCHAR(20) DEFAULT 'LOW',
  pii_accessed VARCHAR(500),
  compliance_violation BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure functions
CREATE OR REPLACE FUNCTION calculate_age_from_dob()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dob IS NOT NULL THEN
        NEW.age := EXTRACT(YEAR FROM AGE(NEW.dob));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure triggers
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'users') THEN
    PERFORM pg_catalog.set_config('search_path', current_schema(), true);
    EXECUTE 'DROP TRIGGER IF EXISTS trg_calculate_user_age ON ' || quote_ident(current_schema()) || '.users';
    EXECUTE 'CREATE TRIGGER trg_calculate_user_age BEFORE INSERT OR UPDATE OF dob ON ' || quote_ident(current_schema()) || '.users FOR EACH ROW EXECUTE FUNCTION calculate_age_from_dob()';
    EXECUTE 'DROP TRIGGER IF EXISTS update_users_modtime ON ' || quote_ident(current_schema()) || '.users';
    EXECUTE 'CREATE TRIGGER update_users_modtime BEFORE UPDATE ON ' || quote_ident(current_schema()) || '.users FOR EACH ROW EXECUTE FUNCTION update_modified_column()';
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'patients') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_calculate_patient_age ON ' || quote_ident(current_schema()) || '.patients';
    EXECUTE 'CREATE TRIGGER trg_calculate_patient_age BEFORE INSERT OR UPDATE OF dob ON ' || quote_ident(current_schema()) || '.patients FOR EACH ROW EXECUTE FUNCTION calculate_age_from_dob()';
    EXECUTE 'DROP TRIGGER IF EXISTS update_patients_modtime ON ' || quote_ident(current_schema()) || '.patients';
    EXECUTE 'CREATE TRIGGER update_patients_modtime BEFORE UPDATE ON ' || quote_ident(current_schema()) || '.patients FOR EACH ROW EXECUTE FUNCTION update_modified_column()';
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'encounters') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS update_encounters_modtime ON ' || quote_ident(current_schema()) || '.encounters';
    EXECUTE 'CREATE TRIGGER update_encounters_modtime BEFORE UPDATE ON ' || quote_ident(current_schema()) || '.encounters FOR EACH ROW EXECUTE FUNCTION update_modified_column()';
  END IF;
END$$;

-- ================= HELP DESK (Patient Grievance + Internal Ticketing) =================
CREATE TABLE IF NOT EXISTS helpdesk_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(30) NOT NULL DEFAULT 'INTERNAL',
  default_priority VARCHAR(20) DEFAULT 'MEDIUM',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS helpdesk_sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority VARCHAR(20) NOT NULL UNIQUE,
  response_hours NUMERIC DEFAULT 8,
  resolution_hours NUMERIC DEFAULT 24,
  auto_escalate_minutes INTEGER DEFAULT 120,
  max_escalation_level INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS helpdesk_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no VARCHAR(20) NOT NULL UNIQUE,
  category_id UUID REFERENCES helpdesk_categories(id),
  channel VARCHAR(30) DEFAULT 'INTERNAL',
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'MEDIUM',
  status VARCHAR(30) DEFAULT 'OPEN',
  source_type VARCHAR(30),
  source_id UUID,
  patient_id UUID REFERENCES patients(id),
  department_id UUID REFERENCES departments(id),
  reported_by_user_id UUID REFERENCES users(id),
  assigned_user_id UUID REFERENCES users(id),
  escalation_level INTEGER DEFAULT 0,
  sla_due_at TIMESTAMP,
  first_response_due_at TIMESTAMP,
  last_escalated_at TIMESTAMP,
  first_response_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  attachments JSONB,
  rating INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Columns added for existing helpdesk_tickets tables (idempotent)
ALTER TABLE helpdesk_tickets ADD COLUMN IF NOT EXISTS first_response_due_at TIMESTAMP;
ALTER TABLE helpdesk_tickets ADD COLUMN IF NOT EXISTS last_escalated_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS helpdesk_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES helpdesk_tickets(id),
  from_level INTEGER DEFAULT 0,
  to_level INTEGER DEFAULT 1,
  reason TEXT,
  triggered_at TIMESTAMP DEFAULT NOW(),
  assigned_to_user_id UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS helpdesk_ticket_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES helpdesk_tickets(id),
  user_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS helpdesk_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  department_id UUID REFERENCES departments(id),
  status VARCHAR(30) DEFAULT 'OPERATIONAL',
  vendor_id UUID,
  purchase_date DATE,
  warranty_till DATE,
  last_maintenance_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO helpdesk_categories (name, type, default_priority) VALUES
  ('IT / Software', 'INTERNAL', 'MEDIUM'),
  ('Hardware / Equipment', 'INTERNAL', 'HIGH'),
  ('Housekeeping', 'INTERNAL', 'MEDIUM'),
  ('Staff Services', 'INTERNAL', 'LOW'),
  ('Patient Care Quality', 'PATIENT_GRIEVANCE', 'HIGH'),
  ('Billing / Payment', 'PATIENT_GRIEVANCE', 'MEDIUM'),
  ('Facilities / Infrastructure', 'PATIENT_GRIEVANCE', 'MEDIUM')
ON CONFLICT (name) DO NOTHING;

INSERT INTO helpdesk_sla_policies (priority, response_hours, resolution_hours, auto_escalate_minutes, max_escalation_level) VALUES
  ('LOW', 24, 72, 1440, 2),
  ('MEDIUM', 8, 48, 720, 3),
  ('HIGH', 4, 24, 240, 3),
  ('CRITICAL', 1, 4, 60, 3)
ON CONFLICT (priority) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_status ON helpdesk_tickets (status);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_priority ON helpdesk_tickets (priority);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_patient ON helpdesk_tickets (patient_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_assigned ON helpdesk_tickets (assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_department ON helpdesk_tickets (department_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_sla_due ON helpdesk_tickets (sla_due_at);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_created_at ON helpdesk_tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_helpdesk_notes_ticket ON helpdesk_ticket_notes (ticket_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_escalations_ticket ON helpdesk_escalations (ticket_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_equipment_department ON helpdesk_equipment (department_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_equipment_status ON helpdesk_equipment (status);
