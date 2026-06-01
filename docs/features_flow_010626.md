You are a software developer or product manager building a clinic management system. Enhance the following feature requests into a detailed, structured, and immediately actionable development prompt covering UI, logic, data, and business rules.

---

## Feature Enhancement Request

You are developing a **Clinic Management System** for a slimming and aesthetic clinic. Implement the following feature additions and modifications across the Doctor's consultation panel and related modules. Follow the specifications below precisely.

---

### FEATURE 1 — Dosage Column on Doctor's Side

Add a **Dosage** input column/field within the Doctor's consultation interface (the panel or table used by doctors to record treatment details per patient visit).

**Requirements:**
- Display the Dosage field alongside existing columns (e.g., treatment name, notes, quantity)
- Input type: text or numeric field with unit label (e.g., mg, ml, cc) — default to `ml` if unit is not yet defined in master data
- Dosage value must be saved per treatment line item in the consultation record
- Dosage field should be editable only by the doctor or authorized medical staff
- If dosage is left empty, flag it as a warning (not a hard block) before finalizing the consultation

---

### FEATURE 2 — Trial & Package Options During Consultation (Doctor's Room)

When a patient is in the **doctor's consultation room**, the system must present selectable **Trial and Package options** based on the program the patient is enrolled in or selecting.

**Slimming Program Packages — Pricing Reference:**

Implement the following as selectable options in the consultation UI:

**Basic Package**
- Trial (1x injection): Rp 700,000
- 4-Week Package: Rp 2,500,000

**Advanced Package**
- Trial (1x injection): Rp 1,200,000
- 4x Injections Package / 4 Weeks: Rp 4,500,000

**Diamond Package**
- Trial (1x injection): Rp 2,000,000
- 3x Injections Package / once every 10 days: Rp 5,500,000
- Additional Oral Medication (add-on): Rp 500,000 / 10 days

**UI Behavior:**
- Display package and trial options as a dropdown or radio button group within the consultation form
- When a package is selected, auto-populate: package name, price, injection frequency, and duration into the consultation record
- Allow the doctor to select one primary package and optionally add the oral medication add-on (Diamond only)
- Selected package and pricing must be passed to the billing/invoice module automatically upon consultation completion
- If the patient has a previously selected package from a prior visit, pre-fill the last-used package as default (with option to change)

---

### FEATURE 3 — Doctor's Schedule Configuration

Enforce and display doctor availability based on the following schedule:

| Day | Available Hours |
|---|---|
| Weekdays (Mon–Fri) | 4:00 PM – 8:00 PM |
| Weekends (Sat–Sun) | 10:00 AM – 8:00 PM |

**Requirements:**
- Block appointment booking outside of defined hours with a clear error message: *"Appointments are only available during clinic hours."*
- Display available time slots dynamically based on the day selected during booking
- Admin can override schedule if needed (with audit log entry)
- Schedule configuration must be manageable from an admin settings panel (not hardcoded)

---

### FEATURE 4 — Aesthetic Program Master Data & Consultation Integration

**4A — Master Data Management (Admin Side)**

Create a **Master Data module for Aesthetic Programs** with the following fields:

| Field | Type | Required |
|---|---|---|
| Aesthetic Program Name | Text | Yes |
| Price (Selling Price) | Currency (Rp) | Yes |
| HPP / COGS | Currency (Rp) | Yes |
| Status (Active/Inactive) | Toggle | Yes |

- Admin can **Create, Read, Update, Delete (CRUD)** aesthetic program entries
- Inactive programs must not appear in the doctor's consultation selection
- System must auto-calculate and display **Gross Margin** = Price − HPP, shown in the master data list view

**4B — Doctor's Consultation Integration**

In the doctor's consultation form, for **Aesthetic Program** treatments:
- Provide a **searchable select input** (autocomplete/typeahead) that queries active Aesthetic Program master data
- Doctor can search by program name and select from results
- Upon selection, auto-populate: Program Name and Price into the consultation line item
- HPP/COGS must **not** be visible to the doctor — it is admin-only data
- Multiple aesthetic programs can be added per consultation session

---

### OUTPUT & IMPLEMENTATION EXPECTATIONS

- All new fields must be reflected in the **database schema** (provide migration or schema update notes)
- UI components must be consistent with the existing design system (forms, tables, modals)
- All pricing fields must use **Indonesian Rupiah (Rp)** formatting with thousand separators
- Consultation records must store: selected package, dosage, program details, timestamp, and attending doctor ID
- Provide **validation rules** for each new field
- If using a frontend framework (React, Vue, etc.), use reusable components for package selection and program search
- If the current tech stack is not specified, **default to a RESTful API backend with a component-based frontend** and note all API endpoints that need to be created or modified