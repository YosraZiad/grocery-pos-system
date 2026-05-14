# Operational Control WMS

## Product Overview

**The Pitch:** An enterprise-grade cold storage WMS engineered for speed, accuracy, and absolute traceability. It replaces fragmented spreadsheets with a high-density, keyboard-driven workspace that visually maps occupancy and rigorously validates every pallet movement.

**For:** Warehouse managers and floor operators who need to process inbound shipments quickly while maintaining strict temperature-zone compliance and error-free spatial management.

**Device:** desktop

**Design Direction:** Industrial clarity meets high-density data. Stark borders, highly legible technical typography, low-glare backgrounds to reduce eye fatigue, and vibrant semantic colors for instant operational awareness.

**Inspired by:** Bloomberg Terminal (data density), Flexport (logistics clarity)

---

## Screens

- **Command Dashboard:** Live facility overview featuring zone-based occupancy heatmaps and critical temperature alerts.
- **Pallet Workspace:** Deep-dive traceability ledger detailing real-time location, thermal history, and movement timeline.
- **Receiving Wizard:** Keyboard-optimized, multi-step intake flow for rapid pallet registration.
- **Rearrangement Interface:** Split-pane source/destination validator to ensure correct spatial and thermal routing.
- **Room Management:** Configuration hub for adjusting zone capacities, temperature thresholds, and rack mapping.

---

## Key Flows

**Rapid Inbound Receiving:** Operator ingests a new shipment.

1. User is on **Command Dashboard** -> presses `Ctrl+N` to launch **Receiving Wizard**
2. User enters manifest details -> presses `Enter` to proceed to Allocation
3. System suggests optimal cold zones -> User confirms with `Enter` -> Pallets are instantly logged and assigned holding locations.

**Pallet Rearrangement:** Operator moves a pallet to prevent thermal expiration.

1. User is on **Pallet Workspace** -> clicks **Relocate** on a specific pallet
2. User sees **Rearrangement Interface** -> scans/types destination rack ID
3. Interface validates temperature zone compatibility -> User clicks **Confirm Move** -> Ledger updates with new location and timestamp.

---

<details>
<summary>Design System</summary>

## Color Palette

- **Primary:** `#0F4C81` - Buttons, active tabs, primary actions (Industrial Navy)
- **Background:** `#F4F5F7` - App background, low-glare (Neutral Off-white)
- **Surface:** `#FFFFFF` - Cards, tables, modal backgrounds
- **Text:** `#111827` - Body text, high-contrast data (Deep Slate)
- **Muted:** `#6B7280` - Secondary text, grid lines, disabled states
- **Accent - Cold:** `#38BDF8` - Thermal indicators, frozen status
- **Accent - Low Occupancy:** `#10B981` - Green heatmap zones (0-50%)
- **Accent - Mid Occupancy:** `#F59E0B` - Yellow heatmap zones (51-85%)
- **Accent - High Occupancy:** `#EF4444` - Red heatmap zones (86-100%)

## Typography

Distinctive, engineered, and highly legible for complex data environments.

- **Headings:** `Space Grotesk`, 600, 20-28px
- **Body:** `IBM Plex Sans`, 400, 14px
- **Data/Monospace:** `JetBrains Mono`, 500, 13px (For SKUs, Pallet IDs, Timestamps)
- **Small text:** `IBM Plex Sans`, 500, 12px
- **Buttons:** `Space Grotesk`, 600, 14px

**Style notes:** Utilitarian aesthetic. 4px base grid. 0px or 2px border radius (sharp, structural). 1px `#E5E7EB` solid borders instead of shadows to define hierarchy. Dense layouts to maximize above-the-fold information.

## Design Tokens

```css
:root {
  --color-primary: #0F4C81;
  --color-background: #F4F5F7;
  --color-surface: #FFFFFF;
  --color-text: #111827;
  --color-muted: #6B7280;
  --color-cold: #38BDF8;
  --color-occ-low: #10B981;
  --color-occ-mid: #F59E0B;
  --color-occ-high: #EF4444;
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius-none: 0px;
  --radius-sm: 2px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-4: 16px;
  --spacing-6: 24px;
}
```

</details>

---

<details>
<summary>Screen Specifications</summary>

### Command Dashboard

**Purpose:** Provide an at-a-glance, spatial understanding of warehouse capacity and thermal integrity.

**Layout:** 64px top navigation, 240px left sidebar, fluid main content area featuring a 2/3 width heatmap and 1/3 width alerts panel.

**Key Elements:**
- **Occupancy Heatmap:** SVG-based top-down grid of the warehouse. Racks colored by occupancy tokens (`--color-occ-low` to `--color-occ-high`). Hover reveals exact pallet count.
- **Thermal Alerts Panel:** List of warnings (e.g., `Zone B: Temp +2°C above threshold`). Red text, stark 1px borders.
- **Quick Action Bar:** Sticky bottom bar, `Space Grotesk` buttons for `Receive Shipment` and `Dispatch`.

**States:**
- **Empty:** "No zones configured. Access Room Management."
- **Loading:** Monochromatic pulsing grid outlines.
- **Error:** Red banner, "Sensor sync failed. Showing last known state."

**Components:**
- **Alert Card:** 100% width, `#FFFFFF` surface, 1px `#EF4444` left border (4px width), 13px mono text for timestamp.
- **Heatmap Cell:** 32x32px minimum, 2px gap, fill color based on capacity percentage.

**Interactions:**
- **Click Heatmap Cell:** Opens side-panel with detailed rack inventory.
- **Hover Alert:** Background shifts to `#F3F4F6`, cursor changes to pointer.

**Responsive:**
- **Desktop:** Heatmap and alerts side-by-side.
- **Tablet:** Alerts stack below heatmap.
- **Mobile:** Not supported (Desktop only).

### Pallet Workspace

**Purpose:** Deep-dive traceability ledger for a single SKU or Pallet ID.

**Layout:** Split pane. Left 40% contains pallet details and thermal chart. Right 60% contains the vertical movement ledger.

**Key Elements:**
- **ID Header:** Huge 28px `JetBrains Mono` text (e.g., `PLT-88492-B`).
- **Thermal History Chart:** Sparkline chart showing temperature over time. `#38BDF8` stroke, 2px width.
- **Movement Ledger:** Dense data table. Columns: `Timestamp`, `Action`, `From`, `To`, `Operator`. 32px row height.

**States:**
- **Empty:** "Search a Pallet ID to view history."
- **Loading:** Skeleton rows in the ledger, 32px height, `#E5E7EB`.
- **Error:** "Traceability data unavailable for this ID."

**Components:**
- **Status Badge:** 24px height, 4px padding, `#10B981` background, `#FFFFFF` text. "CLEARED".
- **Ledger Row:** 1px bottom border `#F3F4F6`, 13px mono text for IDs, 14px body for operator names.

**Interactions:**
- **Click 'From/To' ID:** Navigates to Room Management view for that specific rack.
- **Hover Ledger Row:** Background shifts to `#F9FAFB`.

**Responsive:**
- **Desktop:** Split pane layout.
- **Tablet:** Stacked layout, chart above ledger.
- **Mobile:** Not supported.

### Receiving Wizard

**Purpose:** Keyboard-optimized intake flow for rapid pallet registration.

**Layout:** Centered 600px modal over a dark overlay (`#111827` at 50% opacity). Multi-step progress indicator at top.

**Key Elements:**
- **Progress Bar:** 4px tall, `#0F4C81` fill indicating step (1/3).
- **Input Grid:** 2-column layout for `SKU`, `Quantity`, `Batch`, `Expiry`. Auto-focuses first field.
- **Keyboard Shortcuts Hint:** Bottom row showing `[Enter] Next`, `[Esc] Cancel` in 12px mono text.

**States:**
- **Empty:** Blank inputs with focused blue border (`#0F4C81`, 2px).
- **Loading:** "Validating SKU..." with inline spinner next to input.
- **Error:** Field border turns `#EF4444`, 12px error text below input.

**Components:**
- **Input Field:** 40px height, `#FFFFFF` background, 1px `#D1D5DB` border, `IBM Plex Sans` 14px.
- **Primary Button:** 100% width, 48px height, `#0F4C81` background, white text, "Proceed to Allocation".

**Interactions:**
- **Press Enter:** Validates active field and moves focus to next field.
- **Click 'Add Pallet':** Appends a new blank row to the input grid without leaving the step.

**Responsive:**
- **Desktop:** Centered modal.
- **Tablet:** Modal takes 90% width.
- **Mobile:** Not supported.

### Rearrangement Interface

**Purpose:** Secure, validated interface for moving pallets between locations.

**Layout:** Symmetrical split view. Left side: Source Selection. Right side: Destination Selection.

**Key Elements:**
- **Source Input:** Scan/type field for current Pallet ID. Displays current zone specs.
- **Destination Input:** Scan/type field for target Rack ID.
- **Validation Banner:** Central banner that updates dynamically. Green "Zone Compatible" or Red "Thermal Mismatch Warning".
- **Action Button:** "Execute Move" button, disabled until validation passes.

**States:**
- **Empty:** Waiting for source scan. Large mono placeholder `Awaiting Scan...`
- **Loading:** Validating destination capacity...
- **Error:** "Destination rack full" or "Target zone too warm for this product".

**Components:**
- **Location Card:** 120px height, grey background, shows Rack ID, Zone Temp, and Current Capacity (e.g., `4/5 Pallets`).
- **Validation Icon:** 24x24px, Check (`#10B981`) or Cross (`#EF4444`).

**Interactions:**
- **Type in Destination:** Auto-completes rack IDs. Instantly triggers validation logic.
- **Click 'Execute':** Confirms move, flashes screen green for 200ms, resets interface for next move.

**Responsive:**
- **Desktop:** Symmetrical split left/right.
- **Tablet:** Stacked top/bottom.
- **Mobile:** Not supported.

</details>

---

<details>
<summary>Build Guide</summary>

**Stack:** HTML + Tailwind CSS v3

**Build Order:**
1. **Pallet Workspace** - Establishes the dense typography (`IBM Plex Sans`, `JetBrains Mono`), 4px grid spacing, and strict 1px border structures.
2. **Command Dashboard** - Implements the complex SVG heatmap and semantic color scales (`--color-occ-low` etc).
3. **Receiving Wizard** - Focuses on form elements, focus states, and keyboard navigation optimization.
4. **Rearrangement Interface** - Reuses cards from the dashboard and form elements from the wizard, finalizing validation logic UI.

</details>