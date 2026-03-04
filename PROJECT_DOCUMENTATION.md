# FoodRetainAI — Complete Project Documentation
**Prepared by:** Shah Biraj  
**Date:** March 4, 2026  
**Project URL:** https://retention-ai-main.vercel.app  
**Repository:** retention-ai-main

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Database Setup (Supabase)](#4-database-setup-supabase)
5. [Authentication System](#5-authentication-system)
6. [Dashboard — All Features](#6-dashboard--all-features)
7. [Churn Prediction Engine](#7-churn-prediction-engine)
8. [EDA Charts & Visualizations](#8-eda-charts--visualizations)
9. [AI Insights Section](#9-ai-insights-section)
10. [Reports Section](#10-reports-section)
11. [Chatbot Integration](#11-chatbot-integration)
12. [All Changes Made (Session Log)](#12-all-changes-made-session-log)
13. [Key Files Reference](#13-key-files-reference)
14. [How to Run Locally](#14-how-to-run-locally)
15. [Deployment](#15-deployment)

---

## 1. Project Overview

**FoodRetainAI** is a full-stack AI-powered customer churn prediction and retention analytics dashboard built for the food delivery industry.

### Problem Statement
Food delivery platforms face high customer churn (customers stopping orders). Identifying at-risk customers early and taking targeted action can significantly improve retention and revenue.

### What This Project Does
- **Analyses** a dataset of 6,000 food delivery customers
- **Predicts** whether a specific customer is likely to churn (stop ordering)
- **Visualises** churn patterns through interactive charts
- **Generates** AI-driven business insights automatically
- **Produces** executive reports with actionable recommendations
- **Stores** all predictions in a cloud database (Supabase)

### Dataset
- **6,000 customer records** with fields: gender, age, city, order frequency, total spend, loyalty points, rating, delivery status, payment method, churn status
- Located at: `public/data/dataset.csv`
- Churn is stored as `Active` (retained) or `Inactive` (churned)
- **Overall churn rate: ~49.7%**

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | **React 18 + TypeScript** | UI components, type safety |
| Build Tool | **Vite** | Fast development server, bundling |
| Styling | **Tailwind CSS** | Utility-first CSS styling |
| UI Components | **shadcn/ui + Radix UI** | Pre-built accessible components |
| Charts | **Recharts** | Bar, Pie, Line, Radar charts |
| Animations | **Framer Motion** | Page transitions, animated gauges |
| Database | **Supabase (PostgreSQL)** | Cloud database for storing predictions & chats |
| Email | **EmailJS** | OTP emails for password reset (no backend needed) |
| CSV Parsing | **PapaParse** | Reading the dataset CSV file |
| Icons | **Lucide React** | All icons throughout the app |
| Routing | **React Router v6** | Page navigation |
| Deployment | **Vercel** | Hosting the production app |

---

## 3. Project Structure

```
retention-ai-main/
├── public/
│   └── data/
│       └── dataset.csv          ← 6,000 customer records
├── src/
│   ├── assets/
│   │   └── logo.png
│   ├── components/
│   │   ├── ChurnCharts.tsx      ← All EDA visualisation charts
│   │   ├── NavLink.tsx          ← Navigation link component
│   │   ├── PredictionForm.tsx   ← Churn prediction form + result gauge
│   │   └── ui/                  ← shadcn/ui components (buttons, cards, etc.)
│   ├── hooks/
│   │   └── use-toast.ts         ← Toast notification hook
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts        ← Supabase client configuration
│   │       └── types.ts         ← TypeScript types for DB tables
│   ├── lib/
│   │   ├── dataset.ts           ← CSV loader + statistics engine + predictor
│   │   ├── localAuth.ts         ← localStorage-based authentication
│   │   └── utils.ts             ← Utility functions (cn, classnames)
│   ├── pages/
│   │   ├── ChatbotPage.tsx      ← AI chatbot interface
│   │   ├── DashboardPage.tsx    ← Main dashboard (6 sections)
│   │   ├── HomePage.tsx         ← Landing page
│   │   ├── Index.tsx            ← Route guard (redirects based on auth)
│   │   ├── LoginPage.tsx        ← Sign in / Sign up / Password reset
│   │   └── NotFound.tsx         ← 404 page
│   ├── App.tsx                  ← Route definitions
│   └── main.tsx                 ← App entry point
├── supabase/
│   ├── config.toml              ← Supabase local config
│   ├── functions/
│   │   └── chat/
│   │       └── index.ts         ← Edge Function for AI chatbot (OpenAI)
│   └── migrations/
│       └── 20260304000000_initial_schema.sql  ← Database schema
├── package.json
├── tailwind.config.ts
├── tsconfig.app.json
└── vite.config.ts
```

---

## 4. Database Setup (Supabase)

### Project Details
- **Supabase Project ID:** `uogfbedhjmcuwehahknh`
- **URL:** `https://uogfbedhjmcuwehahknh.supabase.co`

### Database Tables (4 tables)

#### Table 1: `profiles`
Stores all registered user accounts.
```sql
id            UUID (primary key)
email         TEXT (unique)
name          TEXT
password_hash TEXT
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

#### Table 2: `chat_sessions`
Each row = one chatbot conversation thread.
```sql
id         UUID (primary key)
user_email TEXT
title      TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### Table 3: `chat_messages`
Individual messages within a chat session.
```sql
id         UUID (primary key)
session_id UUID (→ chat_sessions.id)
role       ENUM ('user', 'assistant')
content    TEXT
created_at TIMESTAMP
```

#### Table 4: `churn_predictions`
Every prediction made through the dashboard.
```sql
id              UUID (primary key)
user_email      TEXT
gender          TEXT
age             TEXT
city            TEXT
order_frequency INT
price           NUMERIC
loyalty_points  INT
rating          NUMERIC
delivery_status TEXT
payment_method  TEXT
category        TEXT
prediction      ENUM ('Active', 'Inactive')
confidence      NUMERIC  ← e.g. 87.50 means 87.5%
model_used      TEXT
created_at      TIMESTAMP
```

### SQL Fix Applied
PostgreSQL does not support `CREATE TYPE IF NOT EXISTS`. Fixed with:
```sql
DO $$ BEGIN
  CREATE TYPE public.message_role AS ENUM ('user', 'assistant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

### Row Level Security (RLS)
All tables have RLS enabled with permissive `anon` role policies so the frontend can read/write using the public anon key without requiring Supabase Auth.

---

## 5. Authentication System

### How It Works
The app uses **localStorage-based authentication** (not Supabase Auth) — meaning accounts and sessions are stored in the browser's localStorage. This is intentional for simplicity and demo purposes.

### File: `src/lib/localAuth.ts`
```
Functions:
  signUp(email, password, name)   → Creates a new account
  signIn(email, password)         → Authenticates and creates a session
  signOut()                       → Clears the session
  getSession()                    → Returns the current logged-in user
  updatePassword(email, newPwd)   → Updates a user's password
  getAllUsers()                    → Returns all registered accounts
  deleteUser(email)               → Permanently deletes an account
  switchAccount(email)            → Switches active session to another account
```

### Login Page Features (`src/pages/LoginPage.tsx`)
1. **Sign In** — email + password, redirects to dashboard
2. **Sign Up** — name + email + password, creates account
3. **Forgot Password** — 3-step OTP flow:
   - Step 1: Enter email → OTP sent via EmailJS (real email)
   - Step 2: Enter 6-digit OTP (valid 10 minutes)
   - Step 3: Set new password
4. **Toggle** between sign-in and sign-up forms

### EmailJS Configuration
```
Service ID:  service_i418tzj
Template ID: template_aj2261b
Public Key:  Z2ewSk8VBhNUZDGoL
```
Email template variables: `{{to_email}}`, `{{otp}}`, `{{app_name}}`

---

## 6. Dashboard — All Features

### Layout
The dashboard uses a **left sidebar + main content** layout (replaces old top tabs).

```
┌─────────────────────────────────────────────────────┐
│  NAVBAR: Logo | AI Chatbot | Logout                  │
├──────────────┬──────────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT (changes per tab)       │
│              │                                       │
│  Overview    │  Active section renders here          │
│  EDA & Charts│                                       │
│  Predict     │                                       │
│  AI Insights │                                       │
│  Dataset     │                                       │
│  Reports     │                                       │
│              │                                       │
│  ─────────── │                                       │
│  Dataset     │                                       │
│  Loaded card │                                       │
└──────────────┴──────────────────────────────────────┘
```

### 6 Dashboard Sections

#### Section 1: Overview
- **4 summary cards:** Total Customers, Active Customers, Churned Customers, Churn Rate
- **Highlight banners:** Average rating, average loyalty points
- **Quick-navigation shortcuts** to jump to other sections

#### Section 2: EDA & Charts (Exploratory Data Analysis)
All charts computed live from the dataset. See Section 8 for full list.

#### Section 3: Predict Churn
Professional prediction form with gauge output. See Section 7 for details.

#### Section 4: AI Insights
5 automatically computed data-driven business insights. See Section 9.

#### Section 5: Dataset
- Displays the raw dataset in a paginated table
- Filter: All / Active / Churned customers
- **CSV Import** functionality — drag and drop or select a new CSV file to update the dataset

#### Section 6: Reports
Executive summary report with downloadable print support. See Section 10.

### Mobile Support
- **Hamburger menu** button shown on mobile (`<768px`)
- Sidebar slides in from the left
- Dark overlay closes sidebar on tap

---

## 7. Churn Prediction Engine

### File: `src/lib/dataset.ts` → `predictChurn()` function
### UI: `src/components/PredictionForm.tsx`

### Input Parameters
| Field | Description | Risk Factor |
|-------|------------|-------------|
| Total Orders | How many orders the customer placed | <10 = high risk |
| Total Spend (₹) | Lifetime spend in Rupees | <₹5,000 = high risk |
| Rating | Customer's average rating (1–5) | <2.0 = high risk |
| Delivery Delay | Minutes of delay | >30 mins = 2× churn |
| Loyalty Points | Accumulated loyalty points | <50 = higher risk |
| Age Group | Young Adult / Adult / Middle Age / Senior | Adults retain better |

### Scoring Algorithm (Rule-Based / Heuristic)
```
Confidence Score = 0 (start)

If orders < 5    → +25 points
If orders < 10   → +15 points
If spend < 5000  → +20 points
If spend < 20000 → +10 points
If rating < 2.0  → +25 points
If rating < 3.0  → +15 points
If delay > 30    → +20 points
If delay > 15    → +10 points
If loyaltyPts<50 → +15 points
If ageGroup = 'Young Adult' → +5 points
```

### 3-Tier Risk Classification
| Confidence Score | Risk Level | Label |
|-----------------|-----------|-------|
| ≥ 55 | HIGH | "High Risk" |
| 30–54 | MEDIUM | "Medium Risk" |
| 0–29 | LOW | "Safe" |

### Prediction Result Panel
- **SVG Circular Gauge** — fills with colour based on churn % (red=high, amber=medium, green=low)
- **Animated confidence bar**
- **Risk Badge** — coloured pill: HIGH RISK / MEDIUM RISK / LOW RISK
- **Risk Factors list** — explains why the risk is high
- **Suggested Retention Strategies** — personalised recommendations per risk level

### Sample Strategies by Risk Level
**HIGH RISK:**
- Offer 20% discount on next 3 orders
- Assign dedicated customer success contact
- Free priority delivery for 30 days

**MEDIUM RISK:**
- Send re-engagement email with ₹100 coupon
- Targeted push notification with personalised offer
- Double loyalty points on next order

**LOW RISK:**
- Continue standard loyalty reward points
- Encourage referrals with ₹200 bonus
- Send monthly appreciation message

---

## 8. EDA Charts & Visualizations

### File: `src/components/ChurnCharts.tsx`

All charts use **Recharts** and are computed from live dataset statistics.

| Chart | Type | What It Shows |
|-------|------|--------------|
| Churn Distribution | Pie Chart | Active vs Inactive count |
| Churn by City | Bar Chart | Top cities and their churn rates |
| Orders by City | Bar Chart (new) | Top 10 cities by order volume |
| Churn by Age Group | Bar Chart | Which age groups churn most |
| Revenue Distribution | Line Chart | Spend distribution across customers |
| Payment Method Distribution | Pie Chart | Cash/Card/UPI/Wallet breakdown |
| Rating Distribution (Histogram) | Bar Chart (new) | Rating spread in 0.5-step bins |
| Delivery Type vs Churn | Stacked Bar (new) | Churn by delivery status |
| Category Distribution | Pie Chart | Food categories ordered |
| Gender Distribution | Pie Chart | Male/Female split |

**Note:** "Revenue by Delivery Status" chart was removed per review as it was not adding clear value.

---

## 9. AI Insights Section

### File: `src/pages/DashboardPage.tsx` → `insights` array

5 live-computed insights — these numbers change based on the actual dataset:

#### Insight 1: Rating vs Churn
```
"X% of low-rated (<2.0) customers churned"
→ Computed: (churned in <2 rating group) / (total in <2 rating group) × 100
```

#### Insight 2: Delivery Delay Impact
```
"Delayed deliveries lead to X× higher churn rate"
→ Computed: (late delivery churn rate) / (on-time delivery churn rate)
```

#### Insight 3: High Spender Retention ₹
```
"High spenders (₹75K+) have X% retention rate"
→ Computed: % of ₹75K+ customers who are Active
→ Icon: ₹ symbol (replaced $ dollar sign)
```

#### Insight 4: Top Churn City
```
"[City] is the city with highest number of churned customers"
→ Computed: city with maximum inactive customer count
```

#### Insight 5: Overall Churn Rate
```
"Overall churn rate stands at X% — monitor monthly trends"
→ Direct from stats.churnRate
```

Each insight card shows:
- Coloured icon
- Title (with live data)
- Detail explanation
- Actionable recommendation (in primary colour)

---

## 10. Reports Section

### File: `src/pages/DashboardPage.tsx` → `reports` tab

#### What's in the Report
1. **Executive Summary** — Total customers, churn rate, active/inactive counts, avg spend
2. **City Churn Analysis** — Visual bar for top 10 cities by churn count
3. **Delivery Status Breakdown Table** — Revenue (₹K) and churn rate per delivery type
4. **Top 5 Business Recommendations:**
   - Improve delivery speed (biggest churn driver)
   - Re-engage low-rating customers with surveys
   - Launch VIP tier for ₹75K+ spenders
   - City-specific retention campaigns
   - Automated churn alert system

#### Export / Download
- **Print button** (`window.print()`) — exports the report as a PDF via browser print dialog

---

## 11. Chatbot Integration

### File: `supabase/functions/chat/index.ts`

An **OpenAI-powered AI chatbot** (Supabase Edge Function) that can:
- Answer questions about churn data
- Provide retention strategy advice
- Discuss food delivery industry trends

### Setup Required (Not Yet Deployed)
```bash
# Deploy the Edge Function
npx supabase functions deploy chat --project-ref uogfbedhjmcuwehahknh

# Add OpenAI API key as a secret
npx supabase secrets set OPENAI_API_KEY=sk-...
```

### Chatbot Page (`src/pages/ChatbotPage.tsx`)
- Chat interface with message history
- Sessions saved to `chat_sessions` and `chat_messages` tables in Supabase

---

## 12. All Changes Made (Session Log)

### Change 1: Dashboard Sidebar Navigation
**Before:** Top tab bar with 3 tabs (EDA, Predict, Dataset)  
**After:** Left sidebar with 6 sections + sticky navigation  
**Files Changed:** `DashboardPage.tsx`

### Change 2: Prediction Form Redesign
**Before:** Simple form with basic "High Risk / Safe" output  
**After:** Professional form with:
- SVG circular gauge showing churn %
- 3-tier risk (LOW / MEDIUM / HIGH)
- 6 input fields (including Loyalty Points + Age Group)
- Personalised retention strategies
- Animated confidence bar + risk factors list  
**Files Changed:** `PredictionForm.tsx`, `dataset.ts`

### Change 3: New EDA Charts (3 added, 1 removed)
**Added:**
- Orders by City (bar chart)
- Rating Distribution Histogram
- Delivery Type vs Churn (stacked bar)  
**Removed:** Revenue by Delivery Status (per user request)  
**Files Changed:** `ChurnCharts.tsx`, `dataset.ts`

### Change 4: AI Insights Section
**Added:** New dashboard section with 5 live-computed insights  
**Files Changed:** `DashboardPage.tsx`

### Change 5: Reports Section
**Added:** Executive report with city analysis, delivery table, recommendations, print export  
**Files Changed:** `DashboardPage.tsx`

### Change 6: TypeScript Config Fix
**Problem:** `baseUrl: "."` caused a squiggle error under `tsconfig.app.json`  
**Fix:** Removed `baseUrl` — not valid with `moduleResolution: bundler` (TypeScript 5+)  
**Files Changed:** `tsconfig.app.json`

### Change 7: Supabase Database Migration Fix
**Problem:** `CREATE TYPE IF NOT EXISTS` is invalid PostgreSQL syntax  
**Fix:** Replaced with `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`  
**Result:** All 4 tables successfully created and verified ✅  
**Files Changed:** `supabase/migrations/20260304000000_initial_schema.sql`

### Change 8: Dollar → Rupee Symbol in AI Insights
**Before:** DollarSign icon (`$`) next to "High spenders" insight  
**After:** ₹ symbol rendered as a styled inline component  
**Files Changed:** `DashboardPage.tsx`

### Change 9: Registered Accounts Panel (Login Page)
**Added:** A collapsible panel below the login form showing all registered accounts  
**Each account shows:** Initials avatar, name, email, creation date, delete button  
**Added functions:** `getAllUsers()`, `deleteUser()` to `localAuth.ts`  
**Files Changed:** `localAuth.ts`, `LoginPage.tsx`  
*(Later moved to top-right navbar — see Change 10)*

### Change 10: Accounts Dropdown (Top-Right Navbar)
**Moved** accounts panel from login page to top-right corner of the dashboard  
**Features:**
- Avatar button (initials in primary colour)
- Popover showing current user + all registered accounts
- Switch accounts by clicking any account row
- Delete any account with confirmation dialog
- "Add another account" button
- "Sign Out" button  
**Files Changed:** `DashboardPage.tsx`, `localAuth.ts` (added `switchAccount()`)

### Change 11: Account Switch 404 Fix
**Problem:** `navigate(0)` (page reload) caused 404 on Vercel when switching accounts  
**Fix:** Session stored in React state (`useState(() => getSession())`). Switching updates state directly — no reload needed  
**Files Changed:** `DashboardPage.tsx`, `localAuth.ts`

### Change 12: Simplified Top-Right (Removed Dropdown)
**Per user request:** Removed the entire accounts dropdown from the dashboard navbar  
**Restored:** Simple "AI Chatbot" + "Logout" button layout  
**Logout now calls:** `signOut()` (clears localStorage session) before navigating to `/`  
**Files Changed:** `DashboardPage.tsx`

---

## 13. Key Files Reference

### `src/lib/dataset.ts`
- Loads `public/data/dataset.csv` using PapaParse
- `computeStats(records)` → computes all statistics used across the dashboard
- `predictChurn(orders, spend, rating, delay, loyaltyPoints, ageGroup)` → returns prediction result

### `src/lib/localAuth.ts`
- All authentication logic stored in localStorage
- Key: `localAuth_users` → array of user objects
- Key: `localAuth_session` → currently logged-in user

### `src/integrations/supabase/client.ts`
```typescript
const supabaseUrl = 'https://uogfbedhjmcuwehahknh.supabase.co';
const supabaseAnonKey = '...'; // public anon key
```

### `src/components/PredictionForm.tsx`
- `RiskGauge` — SVG circular progress component
- `RiskBadge` — coloured pill component (LOW/MEDIUM/HIGH)
- Form state, submission with 600ms animation delay

---

## 14. How to Run Locally

### Prerequisites
- Node.js 18+ installed
- Git installed

### Steps
```bash
# 1. Clone the repository
git clone https://github.com/your-repo/retention-ai-main.git
cd retention-ai-main

# 2. Install dependencies
npm install
# or with bun:
bun install

# 3. Start development server
npm run dev

# 4. Open in browser
# http://localhost:8080
```

### Build for Production
```bash
npm run build
# Output goes to dist/ folder
```

### Run Tests
```bash
npm run test
```

---

## 15. Deployment

The app is deployed on **Vercel** at:  
👉 **https://retention-ai-main.vercel.app**

### Auto-Deploy Setup
- Connected to GitHub repository
- Every push to `main` branch triggers automatic redeploy
- Build command: `npm run build`
- Output directory: `dist`

### Important Vercel Setting
Since this is a Single Page Application (SPA), all routes must be rewritten to `index.html`.  
Vercel handles this automatically for Vite projects.

### Environment Variables (if needed)
No environment variables are required for the frontend — the Supabase anon key is public and safe to include in client code.

---

## Summary for College Presentation

### What I Built
A **Customer Churn Prediction Dashboard** for food delivery companies using:
- React + TypeScript frontend
- Rule-based machine learning predictor
- Real dataset of 6,000 customers
- Cloud database (Supabase/PostgreSQL)
- Interactive charts and AI insights

### Key Technical Skills Demonstrated
1. **Frontend Development** — React, TypeScript, Tailwind CSS
2. **Data Analysis** — Processing CSV data, computing statistics
3. **Algorithm Design** — Scoring model for churn prediction
4. **Database Design** — 4-table relational schema with RLS
5. **UI/UX Design** — Professional dashboard with animations
6. **Cloud Deployment** — Vercel hosting + Supabase backend
7. **Authentication** — Custom auth system with OTP email reset

### Business Value
- Helps companies identify at-risk customers **before** they churn
- Suggests **personalised retention strategies** per customer
- Provides **data-driven insights** for management decisions
- Generates **executive reports** for business review meetings

---

*Document generated: March 4, 2026*  
*All changes implemented and deployed to production.*
