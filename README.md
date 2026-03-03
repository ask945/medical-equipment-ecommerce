# MedEquip Pro — Medical Equipment E-Commerce

A professional, clinical, and high-performance e-commerce platform built for the medical equipment industry.

Designed for both individual healthcare professionals and B2B institutional buyers, the platform features a responsive, accessible interface with robust product filtering, secure checkout, and a comprehensive B2B subscription and invoice management dashboard.

## 🚀 Technologies Used

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🎨 Key Features & Pages

The application is built based on a 7-screen high-fidelity design system:

1. **Homepage** (`/`) - Hero banner, trust badges, category grid, featured products, and B2B institutional CTA.
2. **Product Listing** (`/products`) - Grid layout with dynamic URL-based category filtering and robust sidebar controls.
3. **Product Detail** (`/product/:id`) - High-value equipment view with image galleries, technical specification tables, reviews, and downloadable documentation.
4. **Shopping Cart** (`/cart`) - Item review with quantity steppers and real-time order subtotal/tax calculations.
5. **Secure Checkout** (`/checkout`) - Multi-step process with shipping methods and dynamic payment tabs (Credit Card, Wire Transfer, Purchase Order).
6. **B2B Dashboard: Invoices** (`/invoices`) - Procurement manager view with KPI cards and filterable payment history table.
7. **B2B Dashboard: Recurring Supplies** (`/supplies`) - Subscription management for high-frequency items (gloves, masks) with quick-action controls.

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation & Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd medical-eq-2
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## 🏗️ Project Structure

- `/src/components` - Reusable UI elements (Header, Button, ProductCard, KPICard, etc.)
- `/src/pages` - Main layout views corresponding to distinct routes
- `/src/data` - Static mock data (`mockData.js`) serving as the application's temporary backend state
- `/src/index.css` - Global Tailwind CSS v4 variables and custom animations

## 📄 License & Design

This project was built from a provided Stitch design schema, optimized for an "Industrial-Clinical" aesthetic prioritizing clarity and trust.
