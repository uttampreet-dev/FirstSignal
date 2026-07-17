// Shared business-impact constants — single source of truth so the landing
// page and the dashboard's Impact tab always state the same ROI.
//
// Derivation (conservative, from the Impact tab's benchmark assumptions):
// an at-risk D2C customer retained is worth ~₹12,400 in lifetime value
// (demo cohort average) against ~₹530 of FirstSignal cost per retained
// customer (LLM + infra + voice, amortized) → ~₹23 recovered per ₹1 spent.
export const ROI_MULTIPLE = 23
