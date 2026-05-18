// ─────────────────────────────────────────────────────────────────────────────
// GlowAI Ingredient Analysis API Service
// ─────────────────────────────────────────────────────────────────────────────
// TODO: Replace BASE_URL with your actual backend endpoint once keys are added.
// The API expects:
//   POST /api/ingredients/analyze
//   Body: { image: string }  — base64 encoded image of the ingredient label
//   Returns: IngredientAnalysisResponse
//
// The API should:
//   1. Run OCR on the image to extract ingredient text
//   2. Parse individual ingredients from the raw text
//   3. Look up each ingredient against a safety database / LLM
//   4. Return structured analysis with safety ratings
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL = "https://your-backend-url.com"; // TODO: Set your API URL

export type SafetyLevel = "safe" | "caution" | "avoid";

export type IngredientFunction =
  | "Humectant"
  | "Emollient"
  | "Surfactant"
  | "Preservative"
  | "Fragrance"
  | "Antioxidant"
  | "Exfoliant"
  | "Anti-aging"
  | "Brightener"
  | "Barrier Repair"
  | "Solvent"
  | "Emulsifier"
  | "UV Filter"
  | "Skin Conditioner"
  | "Anti-inflammatory"
  | "Other";

export interface Ingredient {
  name: string;
  inci: string;
  safetyLevel: SafetyLevel;
  safetyScore: number; // 0–100, higher = safer
  function: IngredientFunction;
  description: string;
  concern?: string;
  benefit?: string;
  skinTypes: string[];
  comedogenic: number; // 0–5
  irritancy: "None" | "Low" | "Moderate" | "High";
}

export interface IngredientAnalysisResponse {
  productName?: string;
  overallScore: number; // 0–100
  totalIngredients: number;
  safeCount: number;
  cautionCount: number;
  avoidCount: number;
  topConcerns: string[];
  topBenefits: string[];
  ingredients: Ingredient[];
  rawText?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA — used when API is not yet configured or for development
// ─────────────────────────────────────────────────────────────────────────────
export const DEMO_ANALYSIS: IngredientAnalysisResponse = {
  productName: "Hydrating Daily Moisturizer",
  overallScore: 74,
  totalIngredients: 12,
  safeCount: 8,
  cautionCount: 2,
  avoidCount: 2,
  topConcerns: [
    "Contains synthetic fragrance — common irritant",
    "Alcohol Denat may be drying for sensitive skin",
  ],
  topBenefits: [
    "Hyaluronic Acid for deep hydration",
    "Niacinamide for brightening & pore reduction",
    "Ceramide NP for barrier repair",
  ],
  ingredients: [
    {
      name: "Hyaluronic Acid",
      inci: "Sodium Hyaluronate",
      safetyLevel: "safe",
      safetyScore: 96,
      function: "Humectant",
      description: "A powerful moisture-binding molecule that holds up to 1000× its weight in water.",
      benefit: "Intense hydration, plumps fine lines, suitable for all skin types.",
      skinTypes: ["Dry", "Oily", "Combination", "Sensitive"],
      comedogenic: 0,
      irritancy: "None",
    },
    {
      name: "Niacinamide",
      inci: "Niacinamide",
      safetyLevel: "safe",
      safetyScore: 94,
      function: "Brightener",
      description: "Vitamin B3 derivative that regulates sebum, minimizes pores, and evens skin tone.",
      benefit: "Reduces dark spots, minimizes pores, strengthens skin barrier.",
      skinTypes: ["Oily", "Combination", "Acne-prone"],
      comedogenic: 0,
      irritancy: "None",
    },
    {
      name: "Ceramide NP",
      inci: "Ceramide NP",
      safetyLevel: "safe",
      safetyScore: 93,
      function: "Barrier Repair",
      description: "A naturally occurring lipid that reinforces the skin's protective moisture barrier.",
      benefit: "Restores barrier function, prevents transepidermal water loss.",
      skinTypes: ["Dry", "Sensitive", "Mature"],
      comedogenic: 0,
      irritancy: "None",
    },
    {
      name: "Glycerin",
      inci: "Glycerin",
      safetyLevel: "safe",
      safetyScore: 92,
      function: "Humectant",
      description: "A naturally derived humectant that draws moisture from the environment into the skin.",
      benefit: "Softens, hydrates, and improves skin texture.",
      skinTypes: ["Dry", "Oily", "Combination", "Sensitive"],
      comedogenic: 0,
      irritancy: "None",
    },
    {
      name: "Vitamin C",
      inci: "Ascorbic Acid",
      safetyLevel: "safe",
      safetyScore: 88,
      function: "Antioxidant",
      description: "A potent antioxidant that protects skin from UV damage and stimulates collagen production.",
      benefit: "Brightens complexion, fades hyperpigmentation, boosts collagen.",
      skinTypes: ["Dull", "Mature", "Hyperpigmentation"],
      comedogenic: 0,
      irritancy: "Low",
    },
    {
      name: "Aloe Vera",
      inci: "Aloe Barbadensis Leaf Extract",
      safetyLevel: "safe",
      safetyScore: 91,
      function: "Anti-inflammatory",
      description: "A soothing plant extract with hydrating and calming properties.",
      benefit: "Soothes irritation, reduces redness, provides light hydration.",
      skinTypes: ["Sensitive", "Acne-prone", "Sunburned"],
      comedogenic: 0,
      irritancy: "None",
    },
    {
      name: "Peptide Complex",
      inci: "Palmitoyl Tripeptide-1",
      safetyLevel: "safe",
      safetyScore: 87,
      function: "Anti-aging",
      description: "Signal peptides that communicate with skin cells to boost collagen and elastin production.",
      benefit: "Firms skin, reduces wrinkles, improves elasticity.",
      skinTypes: ["Mature", "Dry", "Combination"],
      comedogenic: 0,
      irritancy: "None",
    },
    {
      name: "Green Tea Extract",
      inci: "Camellia Sinensis Leaf Extract",
      safetyLevel: "safe",
      safetyScore: 90,
      function: "Antioxidant",
      description: "Rich in polyphenols (EGCG) that fight free radicals and calm inflammation.",
      benefit: "Anti-aging, anti-inflammatory, protective against UV stress.",
      skinTypes: ["Oily", "Acne-prone", "Sensitive"],
      comedogenic: 0,
      irritancy: "None",
    },
    {
      name: "Retinol",
      inci: "Retinol",
      safetyLevel: "caution",
      safetyScore: 61,
      function: "Anti-aging",
      description: "A vitamin A derivative that accelerates cell turnover and boosts collagen production.",
      concern: "May cause purging, redness, or peeling especially on sensitive skin. Not safe during pregnancy.",
      benefit: "Reduces fine lines, evens texture, treats acne long-term.",
      skinTypes: ["Mature", "Acne-prone"],
      comedogenic: 0,
      irritancy: "Moderate",
    },
    {
      name: "Phenoxyethanol",
      inci: "Phenoxyethanol",
      safetyLevel: "caution",
      safetyScore: 58,
      function: "Preservative",
      description: "A synthetic preservative used to prevent microbial growth in cosmetics.",
      concern: "Can cause contact dermatitis in sensitive individuals. Controversial for infant products.",
      skinTypes: ["Oily", "Normal"],
      comedogenic: 0,
      irritancy: "Low",
    },
    {
      name: "Fragrance",
      inci: "Parfum / Fragrance",
      safetyLevel: "avoid",
      safetyScore: 28,
      function: "Fragrance",
      description: "A generic term masking potentially hundreds of undisclosed chemical compounds.",
      concern: "Top allergen in skincare. Triggers contact dermatitis, rosacea flares, and sensitization over time.",
      skinTypes: [],
      comedogenic: 0,
      irritancy: "High",
    },
    {
      name: "Alcohol Denat.",
      inci: "Alcohol Denat.",
      safetyLevel: "avoid",
      safetyScore: 32,
      function: "Solvent",
      description: "Denatured alcohol used as a solvent and to enhance product absorption.",
      concern: "Disrupts the skin barrier, causes transepidermal water loss, and can worsen dryness and sensitivity with prolonged use.",
      skinTypes: [],
      comedogenic: 0,
      irritancy: "High",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// API CALL — replace demo data with real API response here
// ─────────────────────────────────────────────────────────────────────────────
export async function analyzeIngredients(
  imageBase64: string
): Promise<IngredientAnalysisResponse> {
  // TODO: Remove this demo mode check once your backend is ready
  const isApiConfigured = API_BASE_URL !== "https://your-backend-url.com";

  if (!isApiConfigured) {
    // Return demo data with a realistic delay
    await new Promise((r) => setTimeout(r, 3200));
    return DEMO_ANALYSIS;
  }

  const response = await fetch(`${API_BASE_URL}/api/ingredients/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // TODO: Add your Authorization header if needed:
      // "Authorization": `Bearer ${YOUR_API_KEY}`,
    },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!response.ok) {
    const msg = await response.text().catch(() => "Unknown error");
    throw new Error(`Ingredient analysis failed: ${response.status} — ${msg}`);
  }

  return response.json() as Promise<IngredientAnalysisResponse>;
}
