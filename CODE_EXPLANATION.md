# FoodRetainAI — Complete Code Explanation
### Simple Language Guide for College Presentation

**Project:** FoodRetainAI — Customer Churn Prediction Dashboard
**Author:** Shah Biraj
**Date:** March 4, 2026

---

## What is This Project?

This is a web application that helps food delivery businesses predict and prevent **customer churn**.

> **Churn** = A customer who has stopped placing orders (gone Inactive).

The app does three things:
1. **Analyse** — Who has already churned? (Charts and statistics from 6,000 customer records)
2. **Understand** — Why are they churning? (AI-powered insights from the data)
3. **Predict** — Will this customer churn? (Enter a customer's details → get a risk score)

**Tech Stack at a glance:**

| What | Technology |
|------|-----------|
| Frontend (UI) | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Database | Supabase (PostgreSQL in cloud) |
| Build tool | Vite |
| Hosting | Vercel |

---

---

# HOW THE APP RUNS — STEP BY STEP FLOW

```
Browser opens the website
       ↓
index.html loads → finds <div id="root">
       ↓
main.tsx runs → mounts React into that div
       ↓
App.tsx loads → reads the URL → shows the right page
       ↓

  URL = "/"          → HomePage.tsx
  URL = "/login"     → LoginPage.tsx
  URL = "/dashboard" → DashboardPage.tsx  ← MAIN PAGE
  URL = "/chatbot"   → ChatbotPage.tsx
  URL = anything else → NotFound.tsx

       ↓
DashboardPage loads the CSV dataset (6,000 rows)
       ↓
dataset.ts cleans + computes all statistics
       ↓
Dashboard shows Overview → EDA → Predict → Insights → Dataset → Reports
```

---

---

# FILE EXPLANATIONS — IN SEQUENCE

---

## STEP 1 — `src/main.tsx`
### The Starting Point (Runs First)

```tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

**What this does:**
This is the very first file that runs when the website opens.

- `index.html` has an empty `<div id="root"></div>` — a blank container
- `createRoot(document.getElementById("root"))` — React takes control of that blank div
- `.render(<App />)` — React fills it with your entire application

Think of it like a **power switch** — this file turns the React app ON.
Without `main.tsx`, nothing would appear on screen. It runs exactly once.

---

## STEP 2 — `src/App.tsx`
### The Traffic Director (Routing)

```tsx
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chatbot"   element={<ChatbotPage />} />
          <Route path="*"          element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
```

**What this does:**
This file is the **traffic director**. When a user goes to any URL, this file decides which page component to load and show.

| URL Visited | Page Shown |
|-------------|-----------|
| `/` | Home page |
| `/login` | Login / Sign up page |
| `/dashboard` | Main analytics dashboard |
| `/chatbot` | AI chatbot interface |
| any wrong URL | 404 Not Found page |

**The wrapper components explained simply:**

| Wrapper | Purpose |
|---------|---------|
| `<BrowserRouter>` | Enables URL-based navigation (like GPS for pages) |
| `<QueryClientProvider>` | Enables data fetching and caching |
| `<TooltipProvider>` | Makes hover-tooltips work everywhere |
| `<Toaster />` | Enables the small pop-up notification messages (toasts) |

---

## STEP 3 — `src/integrations/supabase/client.ts`
### The Database Connection

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

**What this does:**
This file creates one single **connection object** to your Supabase cloud database.

- `SUPABASE_URL` — the web address of your specific Supabase project
- `SUPABASE_PUBLISHABLE_KEY` — the public key (safe to use in frontend code)
- `createClient(...)` — creates the connection object named `supabase`
- `export` — makes it available to every other file

`import.meta.env.VITE_...` means the values come from a `.env` file (kept secret, not pushed to GitHub).

**After importing `supabase`, any file can talk to the database:**

```typescript
// Read all rows from a table
const { data } = await supabase.from('profiles').select('*');

// Add a new row
await supabase.from('churn_predictions').insert({ user_email: '...', confidence: 78 });

// Update an existing row
await supabase.from('profiles').update({ password_hash: newPwd }).eq('email', email);

// Delete a row
await supabase.from('profiles').delete().eq('email', email);
```

This file is used by `localAuth.ts` (for user accounts) and `PredictionForm.tsx` (to save predictions).

---

## STEP 4 — `src/lib/localAuth.ts`
### Login, Signup, and Session Management

This file handles **everything related to user accounts**.

**Where data is stored:**
- `Supabase → profiles table` — permanent account storage in the cloud database
- `localStorage` — the currently logged-in user's session (stored in the user's own browser)

---

### Function 1: `signUp(email, password, name)`

```typescript
export async function signUp(email, password, name) {
  // 1. Check if this email already has an account
  const { data: existing } = await supabase
    .from('profiles').select('id').eq('email', email).maybeSingle();

  if (existing) {
    return { error: 'An account with this email already exists.' };
  }

  // 2. If email is new, create a row in the profiles table
  const { error } = await supabase
    .from('profiles')
    .insert({ email: email, name: name, password_hash: password });

  return { error: null };
}
```

**In simple words:**
When a new user clicks "Create Account":
1. Check the `profiles` table — does this email already exist?
2. If yes → show an error ("already registered")
3. If no → add a new row in `profiles` with their name, email, and password
4. The user is now registered

---

### Function 2: `signIn(email, password)`

```typescript
export async function signIn(email, password) {
  // Find the user row in the profiles table by email
  const { data } = await supabase
    .from('profiles')
    .select('id, email, name, password_hash')
    .eq('email', email)
    .maybeSingle();

  if (!data)                      return { error: 'No account found.' };
  if (data.password_hash !== password) return { error: 'Incorrect password.' };

  // Password matched — save a session to localStorage
  const session = { id: data.id, email: data.email, name: data.name };
  localStorage.setItem('localAuth_session', JSON.stringify(session));

  return { user: session, error: null };
}
```

**In simple words:**
When a user clicks "Sign In":
1. Look up their email in the Supabase `profiles` table
2. Compare the password they typed vs what is stored
3. If it matches → save their details in **localStorage** (this is what "being logged in" means)
4. Any page can now call `getSession()` to know who is currently logged in

---

### Function 3: `getSession()`

```typescript
export function getSession(): LocalSession | null {
  const raw = localStorage.getItem('localAuth_session');
  return raw ? JSON.parse(raw) : null;
}
```

**In simple words:**
This is the quickest function — it just reads localStorage.

- If a session exists → return the user object `{ id, email, name }`
- If no session exists → return `null` (nobody is logged in)

**Used in:**
- `DashboardPage.tsx` — to check if the user is logged in before showing the dashboard
- `PredictionForm.tsx` — to know whose name to store when saving a prediction

---

### Function 4: `signOut()`

```typescript
export function signOut(): void {
  localStorage.removeItem('localAuth_session');
}
```

**In simple words:**
When the Logout button is clicked, this function simply **deletes the session from localStorage**.
Next time `getSession()` is called, it returns `null` → user is considered logged out.

---

### Function 5: `updatePassword(email, newPassword)`

```typescript
export async function updatePassword(email, newPassword) {
  const { error } = await supabase
    .from('profiles')
    .update({ password_hash: newPassword })
    .eq('email', email);

  return { error: null };
}
```

**In simple words:**
Finds the user's row in the `profiles` table (by email) and updates the `password_hash` column.
Called in Step 3 of the Forgot Password flow after OTP is verified.

---

## STEP 5 — `src/lib/dataset.ts`
### The Data Engine (Most Important Logic File)

This file does three major things:
1. **Load** the CSV file from disk
2. **Clean** the raw data (preprocessing)
3. **Analyse** the data to compute statistics
4. **Predict** churn for a given customer

---

### Part A: `loadDataset()` — Reading the CSV File

```typescript
export async function loadDataset(): Promise<CustomerRecord[]> {
  const response = await fetch('/data/dataset.csv');  // Download the CSV file
  const text = await response.text();                 // Read it as plain text

  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,          // Row 1 = column names (customer_id, gender, age...)
      skipEmptyLines: true,  // Skip blank rows
      dynamicTyping: true,   // Auto-convert "15" (text) → 15 (number)
      complete: (results) => {
        resolve(preprocessRecords(results.data));  // Clean and return
      },
    });
  });
}
```

**In simple words:**
- `fetch('/data/dataset.csv')` — downloads the CSV from the `public/data/` folder
- **PapaParse** is a library that converts CSV text into a JavaScript array of objects
- Think of CSV as an Excel file; PapaParse reads it and gives you an array where each row = one JavaScript object
- After parsing, the data is passed to `preprocessRecords()` to clean it

---

### Part B: `preprocessRecords()` — Cleaning the Data

```typescript
export function preprocessRecords(rawRows) {

  // Step 1: Remove rows that have no customer_id (unusable records)
  const filtered = rawRows.filter((r) => r['customer_id']);

  // Step 2: Remove duplicate orders (same order_id appearing twice)
  const seenOrders = new Set();
  const deduped = filtered.filter((r) => {
    if (seenOrders.has(r['order_id'])) return false;  // already seen = skip
    seenOrders.add(r['order_id']);
    return true;
  });

  // Step 3: Make sure numbers are stored as numbers, not text
  const typed = deduped.map((row) => ({
    ...row,
    price:           Number(row['price']) || 0,
    order_frequency: Number(row['order_frequency']) || 0,
    loyalty_points:  Number(row['loyalty_points']) || 0,
    rating:          row['rating'] > 0 ? Number(row['rating']) : null,
  }));

  // Step 4: Fill in missing ratings using the median rating
  const knownRatings = typed.map((r) => r.rating).filter(v => v !== null);
  const ratingMedian = Math.round(median(knownRatings));  // e.g. 3

  return typed.map((r) => ({
    ...r,
    rating: r.rating ?? ratingMedian,  // if rating is null, use median instead
  }));
}
```

**In simple words:**
Raw CSV data is often messy. This function cleans it in 4 steps:

| Step | Problem Fixed | How |
|------|--------------|-----|
| 1 | Rows with no customer ID | Filter them out |
| 2 | Same order appearing twice | Use a Set to track seen orders |
| 3 | Numbers stored as text strings | Convert with `Number()` |
| 4 | Missing rating values | Replace with the median rating |

This is called **Data Preprocessing** — a standard first step in any data science project.

---

### Part C: `computeStats()` — Calculating All Statistics

```typescript
export function computeStats(data: CustomerRecord[]): DatasetStats {

  // Get unique customers (one customer can have many orders)
  const uniqueCustomers = [...new Set(data.map((d) => d.customer_id))];

  // Map each customer_id to their churn status
  const customerChurn = {};
  data.forEach((d) => { customerChurn[d.customer_id] = d.churned; });

  const active   = uniqueCustomers.filter(c => customerChurn[c] === 'Active').length;
  const inactive = uniqueCustomers.filter(c => customerChurn[c] === 'Inactive').length;
  const total    = uniqueCustomers.length;

  // Group the data by city, age, rating, delivery type, etc.
  data.forEach((d) => {
    cityDist[d.city]++;
    churnByCity[d.city].active++;    // or .inactive++
    churnByAge[d.age].active++;      // or .inactive++
    spendByChurn.active.push(d.price * 83);  // convert to ₹
    ratingByChurn.active.push(d.rating);
    // ... and more
  });

  return {
    totalCustomers:  total,
    activeCustomers: active,
    inactiveCustomers: inactive,
    churnRate: (inactive / total) * 100,   // e.g. 49.7
    avgRating: average(allRatings),         // e.g. 3.04
    churnByCity: churnByCity,
    churnByAge:  churnByAge,
    // ... all stats the dashboard needs
  };
}
```

**In simple words:**
This function reads all 6,000 rows and builds a big summary object called `stats`.
Imagine doing this manually in Excel — filtering, counting, averaging for each city, each age group, each rating — this function does all of that automatically, in one pass.

The `stats` object is passed to every section of the dashboard:
- Overview cards show `stats.totalCustomers`, `stats.churnRate`
- Charts use `stats.churnByCity`, `stats.churnByAge`
- AI Insights do further calculations from `stats.ratingByChurn`, `stats.spendByChurn`

---

### Part D: `predictChurn()` — The Prediction Algorithm

```typescript
export function predictChurn(orders, spend, rating, delay, loyaltyPoints, ageGroup) {

  let riskScore = 0;     // Starts at 0, increases with each risk factor
  const factors = [];    // List of reasons why risk is high

  // Rule 1 — Low order count = risky
  if (orders < 5)  { riskScore += 35; factors.push('Very low order count (< 5)'); }
  if (orders < 10) { riskScore += 20; factors.push('Low order count (< 10)'); }

  // Rule 2 — Low total spend = risky
  if (spend < 10000) { riskScore += 30; factors.push('Very low spend (< ₹10,000)'); }
  if (spend < 25000) { riskScore += 18; factors.push('Low spend (< ₹25,000)'); }

  // Rule 3 — Bad rating = risky (dataset shows < 2.0 rating → 68% churn)
  if (rating < 2.0) { riskScore += 35; factors.push('Very poor rating (< 2.0)'); }
  if (rating < 2.5) { riskScore += 25; factors.push('Poor rating (< 2.5)'); }
  if (rating < 3.5) { riskScore += 15; factors.push('Below average rating'); }

  // Rule 4 — Long delivery delay = risky (delayed deliveries → 2x churn)
  if (delay > 60) { riskScore += 25; factors.push('Severe delay > 60 mins'); }
  if (delay > 30) { riskScore += 20; factors.push('High delay > 30 mins'); }
  if (delay > 15) { riskScore += 10; factors.push('Moderate delay > 15 mins'); }

  // Rule 5 — Low loyalty points = disengaged customer
  if (loyaltyPoints < 50) { riskScore += 15; factors.push('Very low loyalty points'); }

  // Rule 6 — Senior customers churn slightly more
  if (ageGroup === 'Senior') { riskScore += 8; }

  const confidence = Math.min(riskScore, 100);  // Cap at 100%

  // Classify into 3 tiers based on total score
  const riskLevel =
    confidence >= 55 ? 'HIGH' :
    confidence >= 30 ? 'MEDIUM' : 'LOW';

  // Suggest retention strategies based on risk level
  const strategies = [];
  if (confidence >= 55) {
    strategies.push('Offer 20% discount on next 3 orders');
    strategies.push('Priority delivery guarantee');
    strategies.push('Assign dedicated customer success rep');
  } else if (confidence >= 30) {
    strategies.push('Offer 10% discount on next order');
    strategies.push('Double loyalty points on next order');
  } else {
    strategies.push('Continue standard loyalty rewards');
    strategies.push('Encourage referrals with ₹200 bonus');
  }

  return { confidence, riskLevel, factors, strategies };
}
```

**In simple words:**
This is a **scoring system** — like a points-based test:

| Risk Factor | Points Added |
|------------|-------------|
| Orders < 5 | +35 |
| Orders 5–10 | +20 |
| Spend < ₹10,000 | +30 |
| Rating < 2.0 | +35 |
| Delay > 30 mins | +20 |
| Low loyalty (<50 pts) | +15 |
| Senior age group | +8 |

- Add up all the points → that is the "churn confidence percentage"
- **0–29%** → LOW RISK (customer is safe, keep doing what you're doing)
- **30–54%** → MEDIUM RISK (watch this customer, send gentle offers)
- **55–100%** → HIGH RISK (likely to churn — take immediate action)

This approach is called a **Rule-Based / Heuristic Model**. The rules were designed by analysing patterns in the dataset (e.g., we saw that customers with rating < 2 churn 68% of the time).

---

## STEP 6 — `src/pages/LoginPage.tsx`
### The Login and Signup Page

This page has two forms on the same screen:
- **Sign In** (default view)
- **Sign Up** (switch with a toggle button)
- **Forgot Password** (pops up as a dialog)

---

### How form state works in React:

```typescript
const [isSignup,  setIsSignup]  = useState(false);  // Which form to show?
const [email,     setEmail]     = useState('');       // What user typed in email field
const [password,  setPassword]  = useState('');       // What user typed in password field
const [name,      setName]      = useState('');       // Name field (only for signup)
const [loading,   setLoading]   = useState(false);    // Show spinner during login?
```

**In simple words:**
- `useState` stores a value in memory for a specific component
- When you type in an input field, `setEmail(e.target.value)` is called → updates the stored value
- React automatically re-renders the field to show the new text
- `setLoading(true)` while the login request is happening → the button shows a spinner
- `setLoading(false)` when done → spinner goes away

---

### How the form submit works:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();   // Stop browser from refreshing the page

  setLoading(true);

  if (isSignup) {
    const { error } = await signUp(email, password, name);
    if (error) {
      toast({ title: error, variant: 'destructive' });  // Show red error toast
      setLoading(false);
      return;
    }
    navigate('/dashboard');  // Go to dashboard after signup
  } else {
    const { user, error } = await signIn(email, password);
    if (error) {
      toast({ title: error, variant: 'destructive' });
      setLoading(false);
      return;
    }
    navigate('/dashboard');  // Go to dashboard after login
  }
};
```

**In simple words:**
1. `e.preventDefault()` — prevents the browser's default "refresh page on form submit" behaviour
2. Call `signIn()` or `signUp()` from `localAuth.ts`
3. If error → show a red toast notification (the small popup at the bottom)
4. If success → `navigate('/dashboard')` sends the user to the dashboard page

---

### Forgot Password — 3-Step OTP Flow:

```
Step 1: User enters their email
        → sendResetEmail(email) is called
        → Supabase Edge Function generates a 6-digit code, stores it in DB,
          and emails it to the user

Step 2: User enters the 6-digit code from their inbox
        → verifyResetOtp(email, code) is called
        → Supabase checks if the code matches and has not expired (valid 10 mins)

Step 3: User enters a new password
        → updatePassword(email, newPassword) is called
        → Updates password_hash in Supabase profiles table
        → Login dialog closes automatically
```

> **OTP (One-Time Password)** = A temporary code sent to your email to prove you own that email address. It expires after 10 minutes.

---

## STEP 7 — `src/pages/DashboardPage.tsx`
### The Main Dashboard (6 Sections)

This is the largest file (933 lines). It is the core of the entire project.

---

### How the dataset is loaded when the page opens:

```typescript
useEffect(() => {
  loadDataset().then((records) => {
    setData(records);                    // Store the 6,000 rows
    setStats(computeStats(records));     // Compute all statistics
    setLoading(false);                   // Hide loading spinner
  });
}, []);
```

**In simple words:**
- `useEffect` with `[]` = "run this code exactly once, right after the page appears on screen"
- `loadDataset()` reads the CSV file asynchronously (takes a moment)
- `.then(...)` runs after the data is ready
- `setStats(computeStats(records))` — computes all averages, distributions, churn rates in one go
- `setLoading(false)` — hides the spinner and shows the actual content

---

### How the 6-section sidebar navigation works:

```typescript
const sidebarItems = [
  { id: 'overview',  label: 'Overview'     },
  { id: 'eda',       label: 'EDA & Charts' },
  { id: 'predict',   label: 'Predict Churn'},
  { id: 'insights',  label: 'AI Insights'  },
  { id: 'data',      label: 'Dataset'      },
  { id: 'reports',   label: 'Reports'      },
];

const [activeTab, setActiveTab] = useState('overview');
```

Each sidebar button calls `setActiveTab('eda')` (for example).
The main content area checks which tab is active:

```typescript
{activeTab === 'overview' && <OverviewSection />}
{activeTab === 'eda'      && <ChurnCharts stats={stats} />}
{activeTab === 'predict'  && <PredictionForm />}
// ... and so on
```

**In simple words:**
The `&&` operator is React's way of saying "only render this if the condition is true."
So if `activeTab === 'eda'` is false, the charts are not rendered at all — they are completely absent from the DOM. Only the active section is rendered. This is how React shows one section at a time without loading new pages.

---

### Section 1 — Overview: Summary Cards

```typescript
const summaryCards = [
  { label: 'Total Customers',   value: stats.totalCustomers.toLocaleString() },
  { label: 'Active (Retained)', value: stats.activeCustomers.toLocaleString() },
  { label: 'Churn Rate',        value: `${stats.churnRate.toFixed(1)}%` },
  // ...
];
```

**In simple words:**
All card values come from the `stats` object built by `computeStats()`.

- `.toLocaleString()` adds commas: `6000` → `"6,000"`
- `.toFixed(1)` rounds to 1 decimal: `49.666` → `"49.7"`

**Clicking a card** opens a popup modal with a drilled-down chart:
- `onClick={() => setSelectedCard(c.label)}` stores which card was clicked
- The `AnimatePresence` modal block reads `selectedCard` and shows the matching chart from `cardChartMap`

---

### Section 2 — EDA (Charts):

```typescript
{activeTab === 'eda' && (
  <ChurnCharts stats={stats} />
)}
```

Simply passes the `stats` object to the `ChurnCharts` component.
The component does all the chart rendering. See Step 9 for how charts work.

---

### Section 3 — Predict Churn:

```typescript
{activeTab === 'predict' && (
  <PredictionForm />
)}
```

Loads the prediction form component. The form is self-contained in `PredictionForm.tsx`. See Step 8.

---

### Section 4 — AI Insights: How Live Numbers Are Calculated

```typescript
// Insight 1: What % of < 2.0 rated customers churned?
const lowRatingChurnRate = (() => {
  const churned = stats.ratingByChurn.inactive.filter(r => r < 2).length;
  const total   = stats.ratingByChurn.active.filter(r => r < 2).length + churned;
  return total > 0 ? Math.round((churned / total) * 100) : 0;
})();

// Insight 2: How many times MORE do delayed deliveries cause churn?
const delayedChurnRate = (() => {
  const late   = churnByDelivery entries with "late" in the name;
  const ontime = all other entries;
  const lateChurnPct   = (late churned) / (late total);
  const ontimeChurnPct = (ontime churned) / (ontime total);
  return (lateChurnPct / ontimeChurnPct).toFixed(1);  // e.g. 2.1×
})();

// Insight 3: What % of ₹75K+ spenders are still active?
const highSpendRetention = (() => {
  const active = stats.spendByChurn.active.filter(v => v >= 75000).length;
  const total  = active + stats.spendByChurn.inactive.filter(v => v >= 75000).length;
  return Math.round((active / total) * 100);
})();

// Insight 4: Which city has the most churned customers?
const topChurnCity = Object.entries(stats.churnByCity)
  .sort((a, b) => b[1].inactive - a[1].inactive)[0][0];
```

**In simple words:**
All 5 Insight cards show **real live numbers from your actual dataset** — nothing is hardcoded.
If you upload a different CSV, all the insight numbers change automatically.

The `(() => { ... })()` syntax is an **IIFE** (Immediately Invoked Function Expression) — a function that runs itself immediately and returns a value. It's used to do a small calculation and store the result in a constant.

---

### Section 5 — Dataset: CSV Import Feature

```typescript
const importCSV = (e) => {
  const file = e.target.files[0];      // The file the user picked
  const reader = new FileReader();     // Built-in browser API to read files

  reader.onload = (ev) => {
    const text = ev.target.result;     // File contents as text

    Papa.parse(text, {
      header: true,
      complete: (results) => {
        const cleaned = preprocessRecords(results.data);  // Clean the data
        setData(cleaned);
        setStats(computeStats(cleaned));   // Recalculate ALL stats!
        setImportedData(cleaned);          // Show in the table
      },
    });
  };

  reader.readAsText(file);  // Trigger the reading
};
```

**In simple words:**
- A hidden `<input type="file">` is triggered when the "Import CSV" button is clicked
- `FileReader` reads the selected file as plain text (browser built-in, no library needed)
- PapaParse converts the text to rows
- `computeStats()` recalculates everything with the new data
- The entire dashboard instantly updates — every chart, every number, every insight

---

### Section 6 — Reports: Print / Export

```typescript
<Button onClick={() => window.print()}>
  Export / Print
</Button>
```

**In simple words:**
`window.print()` is a built-in browser function. It opens the browser's print dialog.
The user selects "Save as PDF" in the print dialog to download the report as a PDF file.
The report includes: executive summary numbers, city churn bar chart, delivery status table, and the top 5 business recommendations.

---

## STEP 8 — `src/components/PredictionForm.tsx`
### The Churn Prediction Form

This component has two parts visible to the user:
1. **Left side** — Input form (6 fields)
2. **Right side** — Prediction result (gauge, risk badge, factors, strategies)

---

### The SVG Circular Gauge:

```typescript
function RiskGauge({ pct, level }) {
  const r    = 52;                          // Radius of the circle
  const circ = 2 * Math.PI * r;             // Full circumference ≈ 326.5 px

  // How much of the circle to leave "empty" (grey)
  const offset = circ - (pct / 100) * circ;
  // Example: pct = 80% → offset = 0.2 × 326.5 = 65.3px (20% left grey)

  const color = level === 'HIGH' ? '#ef4444' : level === 'MEDIUM' ? '#f97316' : '#22c55e';

  return (
    <svg width={140} height={140}>
      {/* Background grey circle */}
      <circle cx={70} cy={70} r={r} stroke="#e5e7eb" strokeWidth={10} />

      {/* Coloured progress arc */}
      <circle cx={70} cy={70} r={r} stroke={color} strokeWidth={10}
        strokeDasharray={circ}    ← total length of the stroke
        strokeDashoffset={offset} ← how much of the start to skip (leave grey)
        style={{ transition: 'stroke-dashoffset 1s ease' }}  ← smooth animation
      />

      {/* Number in the centre */}
      <text>{pct}%</text>
    </svg>
  );
}
```

**In simple words:**
- A circle's border (stroke) is made into a "dashed line" using `strokeDasharray`
- By setting the dash to the exact full circumference, the whole stroke becomes one single dash
- `strokeDashoffset` controls how much of that dash is hidden from the start
- A small offset = most of the circle is visible (high %) 
- A large offset = most of the circle is hidden (low %)
- The CSS `transition` makes it animate smoothly over 1 second when the result appears

---

### How the prediction is triggered and saved:

```typescript
const handlePredict = () => {
  setRunning(true);   // Show spinning animation on button

  setTimeout(() => {
    // 1. Run the algorithm
    const res = predictChurn(orders, spend, rating[0], delay, loyaltyPoints, ageGroup);
    setResult(res);      // Show the result on screen
    setRunning(false);   // Stop the spinning animation

    // 2. Save this prediction to Supabase database
    const userSession = getSession();    // Who is currently logged in?
    if (userSession) {
      supabase.from('churn_predictions').insert({
        user_email:      userSession.email,
        order_frequency: orders,
        price:           spend,
        rating:          rating[0],
        confidence:      res.confidence,
        prediction:      res.riskLevel === 'LOW' ? 'Active' : 'Inactive',
        model_used:      'Rule-Based Ensemble',
      });
    }
  }, 600);   // 600ms delay = time for the button animation to play
};
```

**In simple words:**
1. `setRunning(true)` makes the button show a spinning loader
2. `setTimeout(..., 600)` waits 600ms — this is intentional for a smooth UX animation
3. `predictChurn(...)` runs the scoring algorithm from `dataset.ts`
4. `setResult(res)` saves the result in component state → React re-renders to show the gauge
5. `getSession()` checks who is logged in
6. `supabase.from('churn_predictions').insert(...)` saves the prediction to the database
7. This creates a permanent audit trail of all predictions ever made

---

## STEP 9 — `src/components/ChurnCharts.tsx`
### All the Charts and Visualisations

This component receives `stats` as a **prop** (input parameter) and draws all charts using the **Recharts** library.

---

### How Recharts charts are built — a simple example:

```typescript
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={cityChurnData}>

    <CartesianGrid strokeDasharray="3 3" />   ← Grid lines behind the bars
    <XAxis dataKey="city" />                  ← X-axis labels (city names)
    <YAxis />                                 ← Y-axis numbers (count)
    <Tooltip />                               ← Hover popup with exact values
    <Legend />                                ← Colour legend below chart

    <Bar dataKey="Active"  fill="#22c55e" />  ← Green bars for Active count
    <Bar dataKey="Churned" fill="#ef4444" />  ← Red bars for Churned count

  </BarChart>
</ResponsiveContainer>
```

**In simple words:**
Think of Recharts like LEGO blocks — you stack components to build a chart:
- `<BarChart data={...}>` is the foundation — it takes an array of objects as data
- Each object in the array = one group of bars on the chart (one city)
- `<Bar dataKey="Active">` = draw one bar whose height is the `Active` value of each object
- `<ResponsiveContainer>` makes the chart resize automatically on different screen sizes

---

### How data is prepared for charts:

```typescript
// Step 1: stats.churnByCity looks like this:
// { "Mumbai": { active: 300, inactive: 250 }, "Delhi": { active: 400, inactive: 310 }, ... }

// Step 2: Convert to the format Recharts needs (array of objects):
const cityChurnData = Object.entries(stats.churnByCity)
  .map(([city, v]) => ({
    city:    city,       // "Mumbai"
    Active:  v.active,   // 300
    Churned: v.inactive, // 250
  }))
  .sort((a, b) => (b.Active + b.Churned) - (a.Active + a.Churned))  // Sort: biggest city first
  .slice(0, 8);   // Only top 8 cities (to keep the chart readable)
```

**In simple words:**
- `Object.entries()` converts an object into an array of `[key, value]` pairs
- `.map()` reshapes each pair into `{ city, Active, Churned }` — the exact shape Recharts needs
- `.sort()` puts the biggest cities first so the chart looks meaningful
- `.slice(0, 8)` shows only top 8 to avoid a crowded chart

The same idea is used for all other charts — the data is reshaped from the `stats` object into chart-friendly arrays.

---

## STEP 10 — `supabase/migrations/*.sql`
### The Database Structure

This SQL file was run on Supabase once to **create the 4 database tables**.

---

### Table 1: `profiles` — User Accounts

```sql
CREATE TABLE profiles (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT    UNIQUE NOT NULL,
  name          TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,
  created_at    TIMESTAMP DEFAULT now(),
  updated_at    TIMESTAMP DEFAULT now()
);
```

| Column | Meaning |
|--------|---------|
| `id` | Auto-generated random unique ID for each user |
| `email` | User's email — must be unique (no two users with same email) |
| `name` | Display name |
| `password_hash` | Stored password (plain text in this demo) |
| `created_at` | When the account was created |

**`NOT NULL`** = This column cannot be empty  
**`UNIQUE`** = No two rows can have the same value in this column  
**`PRIMARY KEY`** = This column uniquely identifies each row

---

### Table 2: `chat_sessions` — Chatbot Conversations

```sql
CREATE TABLE chat_sessions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  title      TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

**In simple words:**
Every time a user starts a new AI chatbot conversation, one row is added here.
This row represents the entire conversation thread and groups all the messages together.

---

### Table 3: `chat_messages` — Individual Chat Messages

```sql
CREATE TABLE chat_messages (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID        REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role       message_role NOT NULL,   -- 'user' or 'assistant'
  content    TEXT        NOT NULL,
  created_at TIMESTAMP   DEFAULT now()
);
```

**In simple words:**
Each individual message (user's question or AI's reply) is one row here.
`session_id` links it to the correct conversation.
`ON DELETE CASCADE` = if a chat session is deleted, all its messages are automatically deleted too.

---

### Table 4: `churn_predictions` — Prediction History

```sql
CREATE TABLE churn_predictions (
  id              UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email      TEXT,
  order_frequency INT,
  price           NUMERIC,
  rating          NUMERIC,
  loyalty_points  INT,
  prediction      TEXT,    -- 'Active' or 'Inactive'
  confidence      NUMERIC, -- e.g. 75 means 75% churn risk
  model_used      TEXT,
  created_at      TIMESTAMP DEFAULT now()
);
```

**In simple words:**
Every time someone clicks "Predict" in the dashboard, a new row is added here.
This stores the full history of predictions — who made them, what inputs were used, and the result.

---

### The ENUM Fix Applied:

```sql
-- WRONG: PostgreSQL does not support this syntax
CREATE TYPE message_role AS ENUM ('user', 'assistant');

-- CORRECT: Handles the case where the type already exists
DO $$ BEGIN
  CREATE TYPE message_role AS ENUM ('user', 'assistant');
EXCEPTION WHEN duplicate_object THEN NULL;  -- If it exists, skip silently
END $$;
```

**In simple words:**
`DO $$ BEGIN ... END $$;` is a PostgreSQL anonymous code block — like a try-catch in SQL.
If the type already exists, instead of crashing, it catches the error and does nothing.
This makes the migration safe to run multiple times.

---

## STEP 11 — Supporting Configuration Files

---

### `tailwind.config.ts` + `src/index.css` — Styling

**Tailwind CSS** is a styling system where you add class names directly to HTML elements — no separate CSS file needed.

```tsx
// Example from DashboardPage.tsx:
<div className="bg-red-500 text-white p-4 rounded-lg flex items-center gap-3">
```

| Class | What it does |
|-------|-------------|
| `bg-red-500` | Red background colour |
| `text-white` | White text colour |
| `p-4` | 16px padding on all sides |
| `rounded-lg` | Rounded corners |
| `flex items-center` | Flexbox layout, items vertically centred |
| `gap-3` | 12px gap between items |

`tailwind.config.ts` adds custom colours and font names used across the project — like `text-primary`, `bg-success`, `font-display`.

---

### `vite.config.ts` — Build Tool

```typescript
export default defineConfig({
  plugins: [react()],                                       // Enable React/JSX support
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }       // "@/..." = "src/..."
  },
  server: { port: 8080 },                                  // Dev server at localhost:8080
});
```

**What Vite does:**
- Converts all your TypeScript + JSX files into plain JavaScript that browsers understand
- Runs a fast development server at `localhost:8080`
- Enables the `@/` import shortcut — so you write `import { supabase } from '@/integrations/supabase/client'` instead of a long relative path like `../../integrations/supabase/client`

---

---

# QUICK REFERENCE TABLE

| File | What it Does | Used By |
|------|-------------|---------|
| `main.tsx` | Starts the app, mounts React | Runs automatically |
| `App.tsx` | URL routing — which page to show | main.tsx loads this |
| `client.ts` | Supabase database connection | localAuth.ts, PredictionForm.tsx |
| `localAuth.ts` | signIn, signUp, signOut, getSession | LoginPage, Dashboard logout button |
| `dataset.ts` | Load CSV, clean data, compute stats, predict churn | DashboardPage, PredictionForm |
| `LoginPage.tsx` | Sign in / Sign up / Forgot password UI | `/login` route |
| `DashboardPage.tsx` | Main dashboard with all 6 sections | `/dashboard` route |
| `PredictionForm.tsx` | Prediction form + SVG gauge + save to DB | Dashboard → Predict section |
| `ChurnCharts.tsx` | All EDA bar/pie/line charts | Dashboard → EDA section |
| `*.sql` | Creates 4 database tables on Supabase | Run once on Supabase cloud |
| `tailwind.config.ts` | Custom CSS colours and fonts | All components |
| `vite.config.ts` | Build tool setup and `@/` path alias | Development and deployment |

---

---

# KEY TERMS TO KNOW FOR YOUR PRESENTATION

| Term | Simple Explanation |
|------|--------------------|
| **Churn** | A customer who stopped ordering (went Inactive) |
| **React Component** | A reusable piece of UI — like a building block |
| **useState** | React's way to store values. When value changes, screen updates automatically |
| **useEffect** | Runs code at specific times — e.g., when page first loads |
| **Props** | Data passed from a parent component to a child component |
| **TypeScript** | JavaScript with type checking — catches errors before running the code |
| **Supabase** | Cloud PostgreSQL database with a simple JavaScript API — no backend server needed |
| **localStorage** | Browser's built-in key-value storage — used here to store the login session |
| **PapaParse** | Library that converts CSV text into JavaScript arrays |
| **Recharts** | Library for building charts (Bar, Pie, Line) in React |
| **Tailwind CSS** | CSS framework where you add class names directly to elements |
| **Vite** | Build tool that runs the dev server and bundles all files for production |
| **Rule-Based Model** | Prediction using if-else rules derived from data patterns (no ML training needed) |
| **Preprocessing** | Cleaning raw data before using it — removing duplicates, filling missing values |
| **Heuristic** | A practical approach based on observation — e.g., "if rating < 2, customer likely to churn" |
| **UUID** | A random unique ID (e.g., `a3f4b1c2-...`) automatically generated by the database |
| **OTP** | One-Time Password — temporary 6-digit code sent to email for verification |
| **RLS** | Row Level Security — Supabase feature controlling who can read/write which rows |
| **IIFE** | A function that calls itself immediately to calculate and return a value |

---

*Document prepared: March 4, 2026*
*FoodRetainAI Project — Shah Biraj*
