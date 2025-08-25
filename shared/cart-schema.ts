import { z } from 'zod';

// Jewelry Categories with hierarchical structure
export const JEWELRY_CATEGORIES = {
  rings: {
    name: 'Rings',
    subCategories: {
      engagement: 'Engagement Rings',
      wedding: 'Wedding Rings',
      cocktail: 'Cocktail Rings',
      solitaire: 'Solitaire Rings',
      tennis: 'Tennis Rings',
      stackable: 'Stackable Rings',
      statement: 'Statement Rings'
    }
  },
  necklaces: {
    name: 'Necklaces',
    subCategories: {
      chains: 'Chains',
      chokers: 'Chokers',
      lockets: 'Lockets',
      beaded_necklaces: 'Beaded Necklaces',
      collars: 'Collars',
      long_necklaces: 'Long Necklaces/Opera Chains',
      multi_layered: 'Multi-layered Necklaces'
    }
  },
  earrings: {
    name: 'Earrings',
    subCategories: {
      studs: 'Stud Earrings',
      hoops: 'Hoop Earrings',
      drops: 'Drop Earrings',
      chandeliers: 'Chandelier Earrings',
      huggies: 'Huggie Earrings',
      climbers: 'Ear Climbers'
    }
  },
  bracelets: {
    name: 'Bracelets',
    subCategories: {
      cuff: 'Cuff',
      tennis: 'Tennis',
      charm: 'Charm',
      chain: 'Chain',
      beaded: 'Beaded',
      link: 'Link',
      bolo: 'Bolo',
      leather: 'Leather',
      diamond: 'Diamond',
      gemstone: 'Gemstone',
      pearl: 'Pearl',
      bridal: 'Bridal',
      minimalist: 'Minimalist',
      traditional: 'Traditional'
    }
  },
  bangles: {
    name: 'Bangles',
    subCategories: {
      classic: 'Classic',
      kada: 'Kada',
      cuff: 'Cuff',
      openable: 'Openable',
      adjustable: 'Adjustable',
      charm: 'Charm',
      diamond: 'Diamond',
      gemstone: 'Gemstone',
      pearl: 'Pearl',
      bridal: 'Bridal',
      minimalist: 'Minimalist',
      traditional: 'Traditional',
      temple: 'Temple',
      kundan: 'Kundan',
      polki: 'Polki',
      navratna: 'Navratna'
    }
  },
  pendants: {
    name: 'Pendants',
    subCategories: {
      solitaire: 'Solitaire',
      halo: 'Halo',
      cluster: 'Cluster',
      heart: 'Heart',
      cross: 'Cross',
      initial: 'Initial',
      diamond: 'Diamond',
      gemstone: 'Gemstone',
      pearl: 'Pearl',
      bridal: 'Bridal',
      minimalist: 'Minimalist',
      traditional: 'Traditional'
    }
  },
  mangalsutra: {
    name: 'Mangalsutra',
    subCategories: {
      traditional: 'Traditional Mangalsutra',
      modern: 'Modern Mangalsutra',
      designer: 'Designer Mangalsutra',
      pendant: 'Mangalsutra Pendants'
    }
  },
  nose_jewelry: {
    name: 'Nose Jewelry',
    subCategories: {
      nose_pins: 'Nose Pins',
      nose_rings: 'Nose Rings',
      nose_studs: 'Nose Studs'
    }
  },
  anklets: {
    name: 'Anklets',
    subCategories: {
      chain: 'Chain Anklets',
      charm: 'Charm Anklets',
      beaded: 'Beaded Anklets'
    }
  },
  brooches: {
    name: 'Brooches',
    subCategories: {
      vintage: 'Vintage Brooches',
      modern: 'Modern Brooches',
      floral: 'Floral Brooches'
    }
  },
  kids_jewelry: {
    name: 'Kids Jewelry',
    subCategories: {
      earrings: 'Kids Earrings',
      bracelets: 'Kids Bracelets',
      necklaces: 'Kids Necklaces',
      rings: 'Kids Rings'
    }
  },
  bridal: {
    name: 'Bridal Collection',
    subCategories: {
      sets: 'Bridal Sets',
      necklaces: 'Bridal Necklaces',
      earrings: 'Bridal Earrings',
      accessories: 'Bridal Accessories'
    }
  },
  material_based: {
    name: 'By Material',
    subCategories: {
      gold_22k: '22K Gold',
      gold_18k: '18K Gold',
      gold_14k: '14K Gold',
      silver: 'Silver',
      platinum: 'Platinum',
      diamond: 'Diamond Jewelry',
      gemstone: 'Gemstone Jewelry'
    }
  }
} as const;

// Materials
export const MATERIALS = {
  GOLD_22K: '22K Gold',
  GOLD_18K: '18K Gold', 
  GOLD_14K: '14K Gold',
  SILVER_STERLING: 'Sterling Silver',
  SILVER_OXIDIZED: 'Oxidized Silver',
  PLATINUM: 'Platinum',
  DIAMOND: 'Diamond',
  RUBY: 'Ruby',
  EMERALD: 'Emerald',
  SAPPHIRE: 'Sapphire',
  PEARL: 'Pearl',
  ARTIFICIAL: 'Artificial/Fashion'
} as const;

// Genders
export const GENDERS = {
  MALE: 'Men',
  FEMALE: 'Women', 
  UNISEX: 'Unisex',
  KIDS: 'Kids'
} as const;

// Occasions
export const OCCASIONS = {
  WEDDING: 'Wedding',
  ENGAGEMENT: 'Engagement',
  DAILY: 'Daily Wear',
  PARTY: 'Party/Event',
  RELIGIOUS: 'Religious/Traditional',
  OFFICE: 'Office Wear',
  CASUAL: 'Casual',
  FORMAL: 'Formal'
} as const;

// Product Filters interface
export interface ProductFilters {
  search?: string;
  category?: string;
  subCategory?: string;
  material?: string;
  gender?: string;
  occasion?: string;
  priceMin?: number;
  priceMax?: number;
  priceMinBhd?: number;
  priceMaxBhd?: number;
  inStock?: boolean;
  sortBy?: 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'weight_asc' | 'weight_desc' | 'stock' | 'rating' | 'discount' | 'premium';
  // Advanced filter options
  weightRange?: string;
  style?: string;
  featured?: boolean;
  newArrivals?: boolean;
  purity?: string;
  discount?: boolean;
  premium?: boolean;
}

// Cart schemas
export const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1),
  price: z.number(),
  name: z.string(),
  image: z.string().optional(),
});

export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  total: z.number(),
  currency: z.enum(['INR', 'BHD']),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;