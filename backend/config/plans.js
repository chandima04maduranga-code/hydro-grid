// Subscription plans. Prices are in Sri Lankan rupees (LKR).
// A limit of null means unlimited. Yearly billing costs 10 × the monthly price.
const PLANS = {
  trial: {
    id: 'trial',
    monthlyPriceLkr: 0,
    trialDays: 14,
    limits: { greenhouses: 1, users: 3, sensorNodes: 5 }
  },
  starter: {
    id: 'starter',
    monthlyPriceLkr: 4900,
    limits: { greenhouses: 2, users: 5, sensorNodes: 10 }
  },
  growth: {
    id: 'growth',
    monthlyPriceLkr: 14900,
    limits: { greenhouses: 10, users: 25, sensorNodes: 50 }
  },
  enterprise: {
    id: 'enterprise',
    monthlyPriceLkr: 39900,
    limits: { greenhouses: null, users: null, sensorNodes: null },
    prioritySupport: true
  }
};

const PLAN_IDS = Object.keys(PLANS);
const BILLING_CYCLES = ['monthly', 'yearly'];
const YEARLY_MONTHS_CHARGED = 10;

const priceFor = (planId, billingCycle) => {
  const plan = PLANS[planId];
  return billingCycle === 'yearly' ? plan.monthlyPriceLkr * YEARLY_MONTHS_CHARGED : plan.monthlyPriceLkr;
};

module.exports = { PLANS, PLAN_IDS, BILLING_CYCLES, YEARLY_MONTHS_CHARGED, priceFor };
