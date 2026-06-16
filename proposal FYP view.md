# Design Specification: FYP Proposal Details View

This document specifies the interface requirements, JSON schema mapping, and component structure for the "Check FYP" Details page in the coordinator module.

## 1. Route Configuration
* **Path**: `/manage-fyp/:id`
* **Name**: `view-fyp-proposal`
* **Component**: `ViewFYPProposalView.vue`

## 2. Breadcrumbs Navigation
Located at the top of the viewport for contextual navigation:
`Dashboard > Manage FYP Proposals > FYP Proposal Details`
```html
<div class="text-[#5c001f] text-sm mb-4">
  <router-link to="/dashboard" class="hover:underline font-semibold">Dashboard</router-link>
  <span class="mx-2 text-gray-500">&gt;</span>
  <router-link to="/manage-fyp" class="hover:underline font-semibold">Manage FYP Proposals</router-link>
  <span class="mx-2 text-gray-500">&gt;</span>
  <span class="font-bold underline text-[#5c001f]">FYP Proposal Details</span>
</div>
```

---

## 3. UI Sections and Fields

### A. General Title Card
* **Project Title**: High-contrast, premium font size (`text-2xl font-bold`).
* **Student/Owner Info**: Name, Matric Number, and Contact Email.
* **Project Type**: Badge labeling the type: `System Development` or `Research`.
* **Supervisor**: Assigned Supervisor name and email, or "Not Assigned Yet" in case of null values.

### B. NABC Model Section
NABC is organized into cards or interactive grids:
1. **Need**: Why does the client need this?
2. **Approach**: What is the proposed system structure or research method?
3. **Benefits**: What value is added?
4. **Competition**: What alternative systems or methods currently exist?
5. **Potential Stakeholders** *(Only displayed for System Development projects)*
6. **Potential Data or Respondents** *(Only displayed for Research projects)*
7. **References**: Bibliography list.

### C. Project Proposal Section
Displays operational objectives and background:
1. **Problem Background and Proposed Solution**
2. **Objectives** (Numbered list)
3. **Scopes** (Target parameters/boundaries)

### D. Technical & Security Requirements Grid
Structured table matching key system inputs:
| Requirement Category | Description |
|---|---|
| **Software** | Operating systems, frameworks, compiler tools |
| **Hardware** | Sensors, GPU cards, microcontrollers, host servers |
| **Technology / Method** | Specific algorithms, paradigms, protocols |
| **Network Elements** | MQTT brokers, wireless standards, server gateways |
| **Security Elements** | Encryption methods, password hashing, JWT controls |
| **Project Area** | Main field of research or technology classification |

---

## 4. API Schema Reference
The view consumes proposals stored in [fyp_proposals.json](file:///d:/Github/application-development-project/localData/fyp_proposals.json) with key structures:
* `projectType`: `"System Development"` or `"Research"`
* `details.nabc.potential_stakeholders`: Displayed conditionally when `projectType === 'System Development'`.
* `details.nabc.potential_data_respondents`: Displayed conditionally when `projectType === 'Research'`.
