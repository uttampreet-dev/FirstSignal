// Multi-brand demo configuration.
// FirstSignal is the platform; each brand below is a "client" it serves.
// The chat demo can switch between them instantly without a page reload.

export interface BrandOrder {
  order_number: string
  items: string
  status: 'Delivered' | 'Delayed' | 'Processing' | 'Shipped'
  amount: number
}

export interface BrandCustomer {
  name: string
  initials: string
  isVip: boolean
  totalOrders: number
  lifetimeValue: string
  sentiment: number
}

export interface Brand {
  id: string
  name: string
  tagline: string
  /** Hex accent used for brand-specific highlights (logo, avatar tint). */
  primaryColor: string
  /** Short label shown inside the brand logo pill. */
  logo: string
  agentName: string
  /** Industry-specific knowledge injected into the AI system prompt. */
  systemPromptContext: string
  sampleOrders: BrandOrder[]
  commonIssues: string[]
  customer: BrandCustomer
}

export const BRANDS: Brand[] = [
  {
    id: 'shopease',
    name: 'ShopEase',
    tagline: 'D2C fashion · ethnic wear',
    primaryColor: '#10b981',
    logo: 'SE',
    agentName: 'Aria',
    systemPromptContext: `ShopEase is a D2C fashion brand that sells ethnic wear, sarees, kurtas, and lehengas across India.

YOUR EXPERTISE AS A D2C FASHION SUPPORT AGENT:
- Customers get anxious after day 3 with no delivery update
- Ethnic wear orders are often for specific events — delays feel personal and urgent
- A delayed Lehenga before a wedding is a crisis. Treat it that way.
- Common issues: wrong size delivered, colour different from website, missing items, delayed delivery
- ShopEase policies: 7-day return window, free exchange once, 3-5 days standard delivery
- Festive season (Oct-Nov) and wedding season (Nov-Feb, Apr-May) mean more delays`,
    sampleOrders: [
      { order_number: 'ORD-2847', items: 'Blue Kurta Set, Cotton Dupatta', status: 'Delayed', amount: 3200 },
      { order_number: 'ORD-2811', items: 'Banarasi Silk Saree', status: 'Delivered', amount: 6800 },
      { order_number: 'ORD-2790', items: 'Anarkali Lehenga (Maroon)', status: 'Shipped', amount: 8400 },
    ],
    commonIssues: [
      'Ask about your delayed order',
      'Say the size or colour is wrong',
      'Mention a wedding/event coming up',
      'Request a refund or exchange',
    ],
    customer: {
      name: 'Priya Sharma',
      initials: 'PS',
      isVip: true,
      totalOrders: 8,
      lifetimeValue: '₹12,400',
      sentiment: 30,
    },
  },
  {
    id: 'freshbox',
    name: 'FreshBox',
    tagline: 'D2C food · subscription meal kits',
    primaryColor: '#f97316',
    logo: 'FB',
    agentName: 'Sage',
    systemPromptContext: `FreshBox is a D2C food brand that delivers subscription meal kits — fresh, pre-portioned ingredients with recipe cards — on a weekly plan across metro cities.

YOUR EXPERTISE AS A D2C FOOD & SUBSCRIPTION SUPPORT AGENT:
- Freshness and cold-chain are everything — a late or warm box means spoiled produce, treat it urgently
- Meal kits are time-sensitive: a box that misses the delivery window ruins a customer's planned dinner
- Customers care about missing/damaged ingredients, incorrect dietary plans (veg/vegan/keto), and skipped-week billing
- Common issues: box arrived warm or spoiled, missing ingredients, wrong meal plan, delivery missed the window, wanting to pause/skip a week
- FreshBox policies: full credit for any spoiled or missing item, free next-box redelivery, pause or skip anytime before the weekly cutoff (Wednesday 6pm)
- Weekend deliveries and heatwaves increase cold-chain risk`,
    sampleOrders: [
      { order_number: 'FB-5521', items: 'Weekly Veg Box (4 meals)', status: 'Delayed', amount: 1499 },
      { order_number: 'FB-5498', items: 'Keto Kit + Extra Protein', status: 'Delivered', amount: 1899 },
      { order_number: 'FB-5470', items: 'Family Dinner Box (6 meals)', status: 'Processing', amount: 2499 },
    ],
    commonIssues: [
      'Say your box arrived warm or spoiled',
      'Report a missing ingredient',
      'Ask to pause or skip next week',
      'Request a credit or redelivery',
    ],
    customer: {
      name: 'Rohan Mehta',
      initials: 'RM',
      isVip: true,
      totalOrders: 14,
      lifetimeValue: '₹21,600',
      sentiment: 34,
    },
  },
  {
    id: 'techgadgets',
    name: 'TechGadgets',
    tagline: 'D2C electronics · gadgets & accessories',
    primaryColor: '#3b82f6',
    logo: 'TG',
    agentName: 'Max',
    systemPromptContext: `TechGadgets is a D2C electronics brand selling gadgets and accessories — earbuds, smartwatches, power banks, chargers, and phone accessories — across India.

YOUR EXPERTISE AS A D2C ELECTRONICS SUPPORT AGENT:
- Customers expect fast, precise troubleshooting before any return is discussed
- Defective-on-arrival (DOA) units, warranty claims, and pairing/connectivity issues are the top concerns
- Many "faulty" reports are fixable — walk through basic troubleshooting first (reset, re-pair, firmware, correct charger)
- Common issues: device won't power on or charge, Bluetooth pairing fails, battery drains fast, wrong/incompatible item, warranty claim
- TechGadgets policies: 10-day replacement for DOA units, 1-year manufacturer warranty, free return pickup for verified defects
- Be clear about warranty vs return windows so expectations are set correctly`,
    sampleOrders: [
      { order_number: 'TG-9034', items: 'Wireless Earbuds Pro (Black)', status: 'Delayed', amount: 4999 },
      { order_number: 'TG-8987', items: '20,000mAh Fast Power Bank', status: 'Delivered', amount: 2299 },
      { order_number: 'TG-8952', items: 'Smartwatch Series 5 + Strap', status: 'Shipped', amount: 7499 },
    ],
    commonIssues: [
      'Say your device won\'t turn on or charge',
      'Report a Bluetooth pairing problem',
      'Ask about a warranty claim',
      'Request a replacement for a defective unit',
    ],
    customer: {
      name: 'Arjun Nair',
      initials: 'AN',
      isVip: false,
      totalOrders: 5,
      lifetimeValue: '₹18,900',
      sentiment: 38,
    },
  },
]

export const DEFAULT_BRAND_ID = BRANDS[0].id

export function getBrand(id?: string | null): Brand {
  return BRANDS.find((b) => b.id === id) ?? BRANDS[0]
}
