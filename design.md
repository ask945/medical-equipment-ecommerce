# Medical Equipment E-Commerce — Design System

> Generated from [Stitch Project: Shopping Cart Summary](https://stitch.withgoogle.com/projects/3281455194300110305)

---

## 1. Design Overview

A **professional, clinical, and trustworthy** e-commerce platform for medical equipment. The design targets both individual healthcare professionals and B2B institutional buyers. It features a clean layout with strong typographic hierarchy, semantic color coding, and a consistent component library across all pages.

**Device Target:** Desktop (1280px–2560px)
**Design Theme:** Light mode, Inter font, 8px roundness, primary `#135bec`

---

## 2. Color Palette

| Token            | Hex       | Usage                                         |
| ---------------- | --------- | --------------------------------------------- |
| `primary`        | `#135bec` | Buttons, links, active states, key highlights |
| `primary-dark`   | `#0e47c1` | Hover states for primary elements             |
| `primary-light`  | `#e8f0fe` | Badges, light backgrounds, selected states    |
| `background`     | `#f8f9fa` | Page background                               |
| `surface`        | `#ffffff` | Cards, panels, modals                         |
| `text-primary`   | `#1a1a2e` | Headings, body text                           |
| `text-secondary` | `#6b7280` | Captions, labels, meta text                   |
| `border`         | `#e5e7eb` | Card borders, dividers, input borders         |
| `success`        | `#22c55e` | Paid, active, in-stock status                 |
| `warning`        | `#f59e0b` | Pending, paused status                        |
| `danger`         | `#ef4444` | Overdue, out-of-stock, error states           |

---

## 3. Typography

| Element         | Size | Weight   | Color            |
| --------------- | ---- | -------- | ---------------- |
| Page Title      | 36px | Bold     | `text-primary`   |
| Section Heading | 24px | Semibold | `text-primary`   |
| Card Title      | 18px | Semibold | `text-primary`   |
| Body            | 16px | Regular  | `text-primary`   |
| Caption / Label | 14px | Regular  | `text-secondary` |
| Small / Badge   | 12px | Medium   | Varies           |

**Font Family:** `Inter, system-ui, -apple-system, sans-serif`

---

## 4. Spacing & Layout

- **Border Radius:** `8px` (all cards, buttons, inputs)
- **Grid System:** 12-column responsive grid
- **Container Max Width:** `1280px`, centered with `auto` margins
- **Section Padding:** `64px` vertical, `24px` horizontal
- **Card Padding:** `24px`
- **Gap between grid items:** `24px`

---

## 5. Pages & Sections

### 5.1 Medical Equipment Homepage

- **Hero Section:** Full-width gradient banner with heading, subtitle, 2 CTA buttons (primary + outlined), hero image
- **Trust Bar:** Icon row with badges (FDA Approved, ISO Certified, 24/7 Support, 10K+ Clients)
- **Featured Categories:** 4-column grid of category cards with images + labels
- **Featured Products:** 4-column product card grid with image, badge, title, rating, price, "Add to Cart" button
- **B2B Supply Banner:** Full-width CTA for institutional buyers
- **Footer:** Multi-column with links, logo, contact info

### 5.2 Product Listing Page

- **Breadcrumbs:** Navigation trail at top
- **Sidebar Filters:** Category checkboxes, price range slider, brand checkboxes, rating filter
- **Product Grid:** 3-column grid of product cards
- **Sorting & Pagination:** Dropdown sort + page numbers at bottom

### 5.3 Product Detail Page

- **Breadcrumbs**
- **Two-column layout:** Left = image gallery (main + thumbnails), Right = product info
- **Product Info:** Title, rating, price, quantity selector, "Add to Cart" + "Request Quote" buttons
- **Tabs:** Description, Technical Specifications (table), Reviews, Documentation (PDF downloads)
- **Related Products:** 4-column grid at bottom

### 5.4 Shopping Cart Summary

- **Two-column layout:** Left = cart item list, Right = order summary
- **Cart Item Row:** Image, name, category, unit price, quantity stepper, row total, remove button
- **Order Summary Card:** Subtotal, shipping, tax, discount code input, total, "Proceed to Checkout" button
- **Empty State:** Illustration + "Continue Shopping" button

### 5.5 Secure Checkout Process

- **Step Indicator:** 4-step progress bar (Shipping → Payment → Review → Confirmation)
- **Shipping Section:** Address form (name, address, city, state, ZIP, phone)
- **Shipping Methods:** Radio cards (Standard, Express, White Glove delivery)
- **Payment Section:** Tab selector (Credit Card, Purchase Order, Wire Transfer), form fields
- **Order Review:** Summary card with line items, totals

### 5.6 Invoice & Payment History

- **Dashboard Layout:** Left sidebar navigation + main content area
- **KPI Cards Row:** Outstanding Balance, Total Invoices, Overdue, Avg Payment Time
- **Filter Bar:** Date range, status filter, search input
- **Invoice Table:** Columns = Invoice #, Date, Due Date, Amount, Status badge, Actions
- **Status Badges:** Green (Paid), Yellow (Pending), Red (Overdue)

### 5.7 Recurring Supply Management

- **Dashboard Layout:** Sidebar + main content
- **Summary Cards:** Active Subscriptions, Next Delivery, Monthly Spend
- **Subscription List:** Cards with product image, name, frequency, quantity, status, actions
- **Quick Action Sidebar:** Pause/Resume, Skip Delivery, Modify Quantity controls

---

## 6. Reusable Components

### Header (2 variants)

1. **PublicHeader** — Logo, nav links (Home, Products, Diagnostics, Surgical, About, Contact), search bar, cart icon with badge count, "Login" button
2. **DashboardHeader** — Logo, portal name, breadcrumbs, user avatar/menu

### Button (variants)

1. **Primary** — Filled blue `#135bec`, white text, 8px radius, hover darkens
2. **Secondary / Outline** — White fill, blue border, blue text, hover fills
3. **Ghost** — No background/border, blue text, hover adds light background
4. **Danger** — Red fill, white text for destructive actions
5. **Sizes:** `sm` (32px h), `md` (40px h), `lg` (48px h)

### Other Shared Components

- **ProductCard** — Image, badge, title, rating stars, price, action button
- **Breadcrumbs** — Slash-separated breadcrumb trail
- **StatusBadge** — Colored pill with text (success/warning/danger/info)
- **KPICard** — Icon, label, value, optional trend indicator
- **FilterSidebar** — Checkbox groups, range sliders, reset button
- **StepIndicator** — Numbered progress steps with active/completed states
- **DataTable** — Sortable columns, row actions, pagination
- **Footer** — Multi-column link layout + copyright

---

## 7. Interactions & Micro-Animations

- **Button hover:** Scale 1.02, shadow elevation, darken background
- **Card hover:** Subtle shadow lift (0 → 8px shadow), scale 1.01
- **Page transitions:** Fade-in on route change
- **Loading states:** Skeleton placeholders with shimmer animation
- **Status badges:** Subtle pulse on urgent items (overdue)
- **Quantity stepper:** Smooth increment/decrement with number transition
