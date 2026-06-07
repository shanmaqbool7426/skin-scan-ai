import { SkinIssue } from "@/context/AppContext";

export interface ProductItem {
  key: string;
  name: string;
  brand: string;
  keyIngredient: string;
  benefit: string;
  price: string;
  rating: number;
  targets: string;
  image: string;
  accentColor: string;
  badge?: string;
}

export const PRODUCT_DB: Record<string, ProductItem> = {
  niacinamide_serum: {
    key: "niacinamide_serum",
    name: "Niacinamide 10% + Zinc 1%",
    brand: "The Ordinary",
    keyIngredient: "Niacinamide",
    benefit: "Minimises pores & controls oil",
    price: "$6 – $12",
    rating: 4.8,
    targets: "Enlarged Pores, Oily Skin",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80",
    accentColor: "#00D4FF",
    badge: "Best Seller",
  },
  salicylic_cleanser: {
    key: "salicylic_cleanser",
    name: "Salicylic Acid 2% Cleanser",
    brand: "CeraVe",
    keyIngredient: "Salicylic Acid",
    benefit: "Unclogs pores & clears acne",
    price: "$12 – $18",
    rating: 4.7,
    targets: "Acne, Blackheads",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80",
    accentColor: "#FF3B5C",
    badge: "Dermatologist Pick",
  },
  vitamin_c_serum: {
    key: "vitamin_c_serum",
    name: "Vitamin C Suspension 23%",
    brand: "The Ordinary",
    keyIngredient: "Ascorbic Acid",
    benefit: "Fades dark spots & brightens",
    price: "$8 – $20",
    rating: 4.5,
    targets: "Dark Spots, Pigmentation",
    image: "https://images.unsplash.com/photo-1617897903246-719242758050?w=400&q=80",
    accentColor: "#FFB800",
    badge: "Brightening",
  },
  hyaluronic_serum: {
    key: "hyaluronic_serum",
    name: "Hyaluronic Acid 2% + B5",
    brand: "The Ordinary",
    keyIngredient: "Hyaluronic Acid",
    benefit: "Deep hydration & plumping",
    price: "$7 – $15",
    rating: 4.9,
    targets: "Dehydration, Dull Skin",
    image: "https://images.unsplash.com/photo-1631390100569-ab7faf5f8a90?w=400&q=80",
    accentColor: "#00FFA3",
    badge: "#1 Hydrator",
  },
  retinol_serum: {
    key: "retinol_serum",
    name: "Retinol 0.5% in Squalane",
    brand: "The Ordinary",
    keyIngredient: "Retinol",
    benefit: "Reduces wrinkles & firms skin",
    price: "$10 – $22",
    rating: 4.6,
    targets: "Fine Lines, Aging",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80",
    accentColor: "#7B61FF",
    badge: "Anti-Aging",
  },
  spf_sunscreen: {
    key: "spf_sunscreen",
    name: "Ultra Light SPF 50+ PA++++",
    brand: "La Roche-Posay",
    keyIngredient: "Mexoryl SX",
    benefit: "Shields from UV & sun damage",
    price: "$18 – $35",
    rating: 4.9,
    targets: "UV Damage, Photoaging",
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80",
    accentColor: "#00D4FF",
    badge: "Essential Daily",
  },
  ceramide_moisturizer: {
    key: "ceramide_moisturizer",
    name: "Moisturising Cream with Ceramides",
    brand: "CeraVe",
    keyIngredient: "Ceramides 1,3,6-II",
    benefit: "Restores skin barrier",
    price: "$14 – $25",
    rating: 4.8,
    targets: "Dry Skin, Barrier Damage",
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=400&q=80",
    accentColor: "#00FFA3",
  },
  azelaic_acid: {
    key: "azelaic_acid",
    name: "Azelaic Acid Suspension 10%",
    brand: "The Ordinary",
    keyIngredient: "Azelaic Acid",
    benefit: "Soothes redness & even tone",
    price: "$8 – $14",
    rating: 4.5,
    targets: "Redness, Hyperpigmentation",
    image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80",
    accentColor: "#FF7B5C",
  },
  aha_bha_toner: {
    key: "aha_bha_toner",
    name: "AHA 30% + BHA 2% Peeling Solution",
    brand: "The Ordinary",
    keyIngredient: "Glycolic + Salicylic Acid",
    benefit: "Exfoliates & refines texture",
    price: "$9 – $16",
    rating: 4.6,
    targets: "Rough Texture, Pores",
    image: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&q=80",
    accentColor: "#7B61FF",
    badge: "Weekly Treatment",
  },
  gentle_cleanser: {
    key: "gentle_cleanser",
    name: "Hydrating Gentle Facial Cleanser",
    brand: "CeraVe",
    keyIngredient: "Ceramides + Hyaluronic Acid",
    benefit: "Cleanses without stripping",
    price: "$10 – $18",
    rating: 4.7,
    targets: "Sensitive Skin, Redness",
    image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80",
    accentColor: "#00D4FF",
  },
};

export function getRecommendedProducts(issues: SkinIssue[], skinType: string): ProductItem[] {
  const keys = new Set<string>();
  keys.add("spf_sunscreen"); // always recommend SPF

  issues.forEach((issue) => {
    const t = issue.type.toLowerCase();
    if (t.includes("acne") || t.includes("pimple") || t.includes("comedone") || t.includes("blackhead") || t.includes("pustule")) {
      keys.add("salicylic_cleanser");
      keys.add("niacinamide_serum");
    }
    if (t.includes("pigment") || t.includes("dark spot") || t.includes("melasma") || t.includes("sun spot") || t.includes("hyperpigment")) {
      keys.add("vitamin_c_serum");
      keys.add("azelaic_acid");
    }
    if (t.includes("pore")) {
      keys.add("niacinamide_serum");
      keys.add("aha_bha_toner");
    }
    if (t.includes("hydrat") || t.includes("dry") || t.includes("dehydrat") || t.includes("flak") || t.includes("dull")) {
      keys.add("hyaluronic_serum");
      keys.add("ceramide_moisturizer");
    }
    if (t.includes("wrinkle") || t.includes("fine line") || t.includes("aging") || t.includes("sagging") || t.includes("elasticit")) {
      keys.add("retinol_serum");
    }
    if (t.includes("redness") || t.includes("sensitiv") || t.includes("inflam")) {
      keys.add("azelaic_acid");
      keys.add("gentle_cleanser");
    }
    if (t.includes("uv") || t.includes("sun") || t.includes("photo")) {
      keys.add("spf_sunscreen");
    }
    if (t.includes("texture") || t.includes("rough")) {
      keys.add("aha_bha_toner");
    }
  });

  const st = skinType.toLowerCase();
  if (st.includes("oily") || st.includes("combination")) {
    keys.add("niacinamide_serum");
    keys.add("salicylic_cleanser");
  }
  if (st.includes("dry") || st.includes("dehydrat")) {
    keys.add("hyaluronic_serum");
    keys.add("ceramide_moisturizer");
  }

  return Array.from(keys)
    .slice(0, 5)
    .map((k) => PRODUCT_DB[k])
    .filter(Boolean);
}
