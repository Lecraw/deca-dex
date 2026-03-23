export interface ResearchTemplate {
  key: string;
  title: string;
  description: string;
  guidingQuestions: string[];
}

export const RESEARCH_TEMPLATES: ResearchTemplate[] = [
  {
    key: "MARKET_RESEARCH",
    title: "Market Research",
    description:
      "Analyze your target market size, demographics, trends, and growth potential.",
    guidingQuestions: [
      "What is the total addressable market (TAM)?",
      "What are current market trends and growth projections?",
      "Who are your primary customer segments?",
      "What is the market demand for your product or service?",
    ],
  },
  {
    key: "COMPETITOR_ANALYSIS",
    title: "Competitor Analysis",
    description:
      "Identify and analyze direct and indirect competitors, their strengths, weaknesses, and market positioning.",
    guidingQuestions: [
      "Who are the top 3-5 competitors in your space?",
      "What are their strengths and weaknesses?",
      "What is your competitive advantage or differentiator?",
      "What pricing strategies do competitors use?",
    ],
  },
  {
    key: "INDUSTRY_OVERVIEW",
    title: "Industry Overview",
    description:
      "Understand the industry landscape, key players, regulations, and future outlook.",
    guidingQuestions: [
      "What industry does your business operate in?",
      "What are key industry regulations or barriers to entry?",
      "What are industry growth projections for the next 3-5 years?",
      "Who are the major players shaping this industry?",
    ],
  },
  {
    key: "TARGET_AUDIENCE",
    title: "Target Audience",
    description:
      "Deep dive into your ideal customer persona, buying behavior, and pain points.",
    guidingQuestions: [
      "What are the demographics of your target audience (age, income, location)?",
      "What are their biggest pain points related to your offering?",
      "How do they currently solve this problem?",
      "What channels do they use to discover new products/services?",
    ],
  },
  {
    key: "FINANCIAL_ANALYSIS",
    title: "Financial Analysis",
    description:
      "Revenue projections, cost structure, pricing strategy, and financial viability.",
    guidingQuestions: [
      "What is your pricing strategy and rationale?",
      "What are your estimated startup costs?",
      "What are projected revenues and expenses for Year 1-3?",
      "When do you expect to break even?",
    ],
  },
  {
    key: "SWOT_ANALYSIS",
    title: "SWOT Analysis",
    description:
      "Assess Strengths, Weaknesses, Opportunities, and Threats for your business concept.",
    guidingQuestions: [
      "What internal strengths does your business have?",
      "What weaknesses or limitations need addressing?",
      "What external opportunities exist in the market?",
      "What threats could impact your success?",
    ],
  },
];
