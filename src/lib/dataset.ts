import Papa from 'papaparse';

export interface CustomerRecord {
  customer_id: string;
  gender: string;
  age: string;
  city: string;
  signup_date: string;
  order_id: string;
  order_date: string;
  restaurant_name: string;
  dish_name: string;
  category: string;
  quantity: number;
  price: number;
  payment_method: string;
  order_frequency: number;
  last_order_date: string;
  loyalty_points: number;
  churned: 'Active' | 'Inactive';
  rating: number | null;
  rating_date: string;
  delivery_status: string;
}

export interface DatasetStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  churnRate: number;
  avgOrderFrequency: number;
  avgPrice: number;
  avgRating: number;
  avgLoyaltyPoints: number;
  totalSpendRupees: number;
  cityDistribution: Record<string, number>;
  genderDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  paymentDistribution: Record<string, number>;
  deliveryDistribution: Record<string, number>;
  restaurantDistribution: Record<string, number>;
  churnByCity: Record<string, { active: number; inactive: number }>;
  churnByAge: Record<string, { active: number; inactive: number }>;
  spendByChurn: { active: number[]; inactive: number[] };
  ratingByChurn: { active: number[]; inactive: number[] };
  frequencyByChurn: { active: number[]; inactive: number[] };
  retainedCount: number;
  revenueByDeliveryStatus: Record<string, number>;
  churnByDeliveryStatus: Record<string, { active: number; inactive: number }>;
}

const PKR_RATE = 83;

/** Compute the median of a numeric array */
function medianOf(arr: number[]): number {
  if (!arr.length) return 3;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Full preprocessing pipeline applied to any raw record array:
 *  1. Filter rows without a customer_id
 *  2. Remove duplicate order_ids (keep first occurrence)
 *  3. Cast numeric fields
 *  4. Impute missing / zero ratings with median of known ratings (1-5)
 */
export function preprocessRecords(rawRows: Record<string, unknown>[]): CustomerRecord[] {
  // Step 1 – filter invalid rows
  const filtered = rawRows.filter((r) => r['customer_id']);

  // Step 2 – deduplicate by order_id
  const seenOrders = new Set<string>();
  const deduped = filtered.filter((r) => {
    const oid = String(r['order_id'] ?? '');
    if (!oid || seenOrders.has(oid)) return false;
    seenOrders.add(oid);
    return true;
  });

  // Step 3 – cast numeric fields
  const typed = deduped.map((row) => ({
    ...row,
    quantity: Number(row['quantity']) || 0,
    price: Number(row['price']) || 0,
    order_frequency: Number(row['order_frequency']) || 0,
    loyalty_points: Number(row['loyalty_points']) || 0,
    rating: row['rating'] && Number(row['rating']) > 0 ? Number(row['rating']) : null,
  })) as CustomerRecord[];

  // Step 4 – impute missing ratings with median of known ratings
  const knownRatings = typed
    .map((r) => r.rating)
    .filter((v): v is number => v !== null && v >= 1 && v <= 5);
  const ratingMedian = Math.round(medianOf(knownRatings));

  return typed.map((r) => ({
    ...r,
    rating: r.rating ?? ratingMedian,
  }));
}

export async function loadDataset(): Promise<CustomerRecord[]> {
  const response = await fetch('/data/dataset.csv');
  const text = await response.text();

  return new Promise((resolve) => {
    Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        resolve(preprocessRecords(results.data));
      },
    });
  });
}

export function computeStats(data: CustomerRecord[]): DatasetStats {
  const uniqueCustomers = [...new Set(data.map((d) => d.customer_id))];
  const customerChurn: Record<string, string> = {};
  data.forEach((d) => { customerChurn[d.customer_id] = d.churned; });

  const active = uniqueCustomers.filter((c) => customerChurn[c] === 'Active').length;
  const inactive = uniqueCustomers.filter((c) => customerChurn[c] === 'Inactive').length;
  const total = uniqueCustomers.length;

  const ratings = data.filter((d) => d.rating !== null).map((d) => d.rating as number);

  const cityDist: Record<string, number> = {};
  const genderDist: Record<string, number> = {};
  const catDist: Record<string, number> = {};
  const payDist: Record<string, number> = {};
  const delDist: Record<string, number> = {};
  const restDist: Record<string, number> = {};
  const churnByCity: Record<string, { active: number; inactive: number }> = {};
  const churnByAge: Record<string, { active: number; inactive: number }> = {};
  const spendByChurn = { active: [] as number[], inactive: [] as number[] };
  const ratingByChurn = { active: [] as number[], inactive: [] as number[] };
  const freqByChurn = { active: [] as number[], inactive: [] as number[] };
  const revByDel: Record<string, number> = {};
  const churnByDel: Record<string, { active: number; inactive: number }> = {};

  data.forEach((d) => {
    cityDist[d.city] = (cityDist[d.city] || 0) + 1;
    genderDist[d.gender] = (genderDist[d.gender] || 0) + 1;
    catDist[d.category] = (catDist[d.category] || 0) + 1;
    payDist[d.payment_method] = (payDist[d.payment_method] || 0) + 1;
    delDist[d.delivery_status] = (delDist[d.delivery_status] || 0) + 1;
    restDist[d.restaurant_name] = (restDist[d.restaurant_name] || 0) + 1;
    revByDel[d.delivery_status] = (revByDel[d.delivery_status] || 0) + d.price * PKR_RATE;
    if (!churnByDel[d.delivery_status]) churnByDel[d.delivery_status] = { active: 0, inactive: 0 };
    if (d.churned === 'Active') churnByDel[d.delivery_status].active++;
    else churnByDel[d.delivery_status].inactive++;

    if (!churnByCity[d.city]) churnByCity[d.city] = { active: 0, inactive: 0 };
    if (d.churned === 'Active') churnByCity[d.city].active++;
    else churnByCity[d.city].inactive++;

    if (!churnByAge[d.age]) churnByAge[d.age] = { active: 0, inactive: 0 };
    if (d.churned === 'Active') churnByAge[d.age].active++;
    else churnByAge[d.age].inactive++;

    const priceRupees = d.price * PKR_RATE;
    if (d.churned === 'Active') {
      spendByChurn.active.push(priceRupees);
      if (d.rating !== null) ratingByChurn.active.push(d.rating);
      freqByChurn.active.push(d.order_frequency);
    } else {
      spendByChurn.inactive.push(priceRupees);
      if (d.rating !== null) ratingByChurn.inactive.push(d.rating);
      freqByChurn.inactive.push(d.order_frequency);
    }
  });

  return {
    totalCustomers: total,
    activeCustomers: active,
    inactiveCustomers: inactive,
    churnRate: total > 0 ? (inactive / total) * 100 : 0,
    avgOrderFrequency: avg(data.map((d) => d.order_frequency)),
    avgPrice: avg(data.map((d) => d.price * PKR_RATE)),
    avgRating: avg(ratings),
    avgLoyaltyPoints: avg(data.map((d) => d.loyalty_points)),
    totalSpendRupees: data.reduce((s, d) => s + d.price * PKR_RATE, 0),
    cityDistribution: cityDist,
    genderDistribution: genderDist,
    categoryDistribution: catDist,
    paymentDistribution: payDist,
    deliveryDistribution: delDist,
    restaurantDistribution: restDist,
    churnByCity,
    churnByAge,
    spendByChurn,
    ratingByChurn,
    frequencyByChurn: freqByChurn,
    retainedCount: active,
    revenueByDeliveryStatus: revByDel,
    churnByDeliveryStatus: churnByDel,
  };
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function predictChurn(
  orders: number,
  spend: number,
  rating: number,
  delay: number,
  loyaltyPoints: number = 100,
  ageGroup: string = 'Adult',
): {
  prediction: 'High Risk' | 'Medium Risk' | 'Safe';
  confidence: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  factors: string[];
  strategies: string[];
} {
  let riskScore = 0;
  const factors: string[] = [];

  // Order frequency — dataset avg ~15 orders; low frequency = churn signal
  if (orders < 5)       { riskScore += 35; factors.push('Very low order frequency (< 5 orders)'); }
  else if (orders < 10) { riskScore += 20; factors.push('Low order frequency (< 10 orders)'); }
  else if (orders < 15) { riskScore += 8; }

  // Spend (₹) — dataset spend ranges: 0-25K, 25K-50K, 50K-75K, 75K-100K, 100K+
  // High spenders churn less (dataset insight)
  if (spend < 10000)       { riskScore += 30; factors.push('Very low total spend (< ₹10,000)'); }
  else if (spend < 25000)  { riskScore += 18; factors.push('Low total spend (< ₹25,000)'); }
  else if (spend < 50000)  { riskScore += 8; }
  // 50K+ → no penalty (high spenders retained)

  // Rating — dataset insight: < 2 rating → ~68% churn probability
  if (rating < 2)        { riskScore += 35; factors.push('Very poor rating (< 2.0) — high churn signal'); }
  else if (rating < 2.5) { riskScore += 25; factors.push('Poor rating (< 2.5)'); }
  else if (rating < 3.5) { riskScore += 15; factors.push('Below average rating (< 3.5)'); }
  else if (rating < 4)   { riskScore += 5; }
  // 4+ → no penalty

  // Delivery delay — dataset insight: delayed delivery → 2x churn rate
  if (delay > 60)      { riskScore += 25; factors.push('Severe delivery delay (> 60 mins)'); }
  else if (delay > 30) { riskScore += 20; factors.push('High delivery delay (> 30 mins) — 2× churn risk'); }
  else if (delay > 15) { riskScore += 10; factors.push('Moderate delivery delay (> 15 mins)'); }

  // Loyalty points — low loyalty = disengaged customer
  if (loyaltyPoints < 50)       { riskScore += 15; factors.push('Very low loyalty points (< 50)'); }
  else if (loyaltyPoints < 150) { riskScore += 8; }
  // 150+ → no penalty

  // Age group bonus/penalty (dataset trends)
  if (ageGroup === 'Senior') { riskScore += 8; factors.push('Senior age group — slightly higher churn tendency'); }

  const confidence = Math.min(Math.round(riskScore), 100);
  const riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = confidence >= 55 ? 'HIGH' : confidence >= 30 ? 'MEDIUM' : 'LOW';

  // Retention strategies personalised by risk profile
  const strategies: string[] = [];
  if (confidence >= 55) {
    strategies.push('Offer 20% discount on next 3 orders');
    strategies.push('Priority delivery guarantee');
    strategies.push('Assign a dedicated customer success rep');
    strategies.push('Send personalised loyalty coupon via SMS');
    strategies.push('Trigger AI chatbot re-engagement campaign');
  } else if (confidence >= 30) {
    strategies.push('Offer 10% discount on next order');
    strategies.push('Enrol in loyalty rewards tier upgrade');
    strategies.push('Send personalised restaurant recommendations');
    strategies.push('Invite to exclusive seasonal promotion');
  } else {
    strategies.push('Continue standard loyalty reward points');
    strategies.push('Encourage referrals with ₹200 bonus');
    strategies.push('Send monthly appreciation message');
    strategies.push('Offer subscription plan with free delivery');
  }

  return {
    prediction: confidence >= 55 ? 'High Risk' : confidence >= 30 ? 'Medium Risk' : 'Safe',
    confidence,
    riskLevel,
    factors: factors.length > 0 ? factors : ['No significant risk factors identified'],
    strategies,
  };
}
