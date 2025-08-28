import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { db } from '../db.js';
import { products } from '../../shared/schema.js';
import { sql } from 'drizzle-orm';

export interface ProductBarcodeData {
  productCode: string;
  productName: string;
  purity: string;
  grossWeight: string;
  netWeight: string;
  stones: string;
  goldRate: string;
  approxPrice: string;
}

export async function generateProductCode(category: string, subCategory?: string, year: number = new Date().getFullYear()): Promise<string> {
  // Get category and subcategory abbreviations
  const categoryAbbreviation = getCategoryAbbreviation(category);
  const subCategoryAbbreviation = getSubCategoryAbbreviation(category, subCategory);
  
  // Optimized query: Get only the maximum sequence number using SQL MAX function
  let maxSequence = 0;
  try {
    const result = await db.select({ 
      maxCode: sql<number>`MAX(CAST(SUBSTRING(product_code FROM LENGTH(product_code) - 2) AS INTEGER))`
    }).from(products).where(sql`product_code ~ '^PJ-.*-[0-9]{3}$'`);
    
    maxSequence = result[0]?.maxCode || 0;
  } catch (error) {
    // Fallback to simple count if regex query fails
    const count = await db.select({ count: sql<number>`count(*)` }).from(products);
    maxSequence = count[0]?.count || 0;
  }
  const sequentialNumber = String(maxSequence + 1).padStart(3, '0');
  
  return `PJ-${categoryAbbreviation}-${subCategoryAbbreviation}-${year}-${sequentialNumber}`;
}

function getCategoryAbbreviation(category: string): string {
  const categoryMappings: { [key: string]: string } = {
    // Main categories
    'rings': 'RN',
    'necklaces': 'NK', 
    'earrings': 'ER',
    'bracelets': 'BR',
    'bangles': 'BG',
    'pendants': 'PD',
    'mangalsutra': 'MS',
    'mangalsutra & thali chains': 'MS',
    'nose jewellery': 'NJ',
    'anklets & toe rings': 'AN',
    'brooches & pins': 'BP',
    'kids jewellery': 'KJ',
    'bridal & special collections': 'SC',
    'shop by material / gemstone': 'MT',
    'material': 'MT',
    'gemstone': 'MT'
  };
  
  return categoryMappings[category.toLowerCase()] || 'GN'; // GN for General
}

function getSubCategoryAbbreviation(category: string, subCategory?: string): string {
  if (!subCategory) return 'GN';
  
  const categoryKey = category.toLowerCase();
  const subCategoryKey = subCategory.toLowerCase();
  
  // Comprehensive subcategory mappings
  const subCategoryMappings: { [category: string]: { [subCategory: string]: string } } = {
    'rings': {
      'engagement rings': 'ENG',
      'engagement_rings': 'ENG',
      'wedding bands': 'WB',
      'wedding_bands': 'WB',
      'couple rings': 'CR',
      'couple_rings': 'CR',
      'cocktail party rings': 'CPR',
      'cocktail_party_rings': 'CPR',
      'daily wear rings': 'DWR',
      'daily_wear_rings': 'DWR',
      'mens rings': 'MR',
      'mens_rings': 'MR'
    },
    'necklaces': {
      'chains': 'CHN',
      'chokers': 'CH',
      'lockets': 'LK',
      'beaded necklaces': 'BD',
      'beaded_necklaces': 'BD',
      'collars': 'COL',
      'long necklaces opera chains': 'LON',
      'long_necklaces_opera_chains': 'LON',
      'multi layered necklaces': 'MLN',
      'multi_layered_necklaces': 'MLN'
    },
    'earrings': {
      'studs': 'ST',
      'hoops': 'HP',
      'drops danglers': 'DR',
      'drops_danglers': 'DR',
      'chandbalis': 'CHB',
      'jhumkas': 'JK',
      'ear cuffs': 'EC',
      'ear_cuffs': 'EC',
      'kids earrings': 'KER',
      'kids_earrings': 'KER'
    },
    'bracelets': {
      'cuff': 'CF',
      'tennis': 'TN',
      'charm': 'CM',
      'chain': 'CHN',
      'beaded': 'BD',
      'link': 'LK',
      'bolo': 'BL',
      'leather': 'LTH',
      'diamond': 'DM',
      'gemstone': 'GS',
      'pearl': 'PRL',
      'bridal': 'BDL',
      'minimalist': 'MIN',
      'traditional': 'TRD'
    },
    'bangles': {
      'classic': 'CL',
      'kada': 'KD',
      'cuff': 'CF',
      'openable': 'OP',
      'adjustable': 'ADJ',
      'charm': 'CM',
      'diamond': 'DM',
      'gemstone': 'GS',
      'pearl': 'PRL',
      'bridal': 'BDL',
      'minimalist': 'MIN',
      'traditional': 'TRD',
      'temple': 'TMP',
      'kundan': 'KND',
      'polki': 'PLK',
      'navratna': 'NVR'
    },
    'pendants': {
      'solitaire': 'SOL',
      'halo': 'HL',
      'cluster': 'CLT',
      'heart': 'HRT',
      'cross': 'CRS',
      'initial': 'INI',
      'diamond': 'DM',
      'gemstone': 'GS',
      'pearl': 'PRL',
      'bridal': 'BDL',
      'minimalist': 'MIN',
      'traditional': 'TRD'
    },
    'mangalsutra': {
      'traditional mangalsutra': 'TMS',
      'traditional_mangalsutra': 'TMS',
      'modern mangalsutra': 'MMS',
      'modern_mangalsutra': 'MMS',
      'thali thirumangalyam chains': 'TTC',
      'thali_thirumangalyam_chains': 'TTC'
    },
    'mangalsutra & thali chains': {
      'traditional mangalsutra': 'TMS',
      'traditional_mangalsutra': 'TMS',
      'modern mangalsutra': 'MMS',
      'modern_mangalsutra': 'MMS',
      'thali thirumangalyam chains': 'TTC',
      'thali_thirumangalyam_chains': 'TTC'
    },
    'nose jewellery': {
      'nose pins': 'NP',
      'nose_pins': 'NP',
      'nose rings nath': 'NR',
      'nose_rings_nath': 'NR',
      'septum rings': 'SR',
      'septum_rings': 'SR'
    },
    'anklets & toe rings': {
      'silver anklets': 'SA',
      'silver_anklets': 'SA',
      'beaded anklets': 'BA',
      'beaded_anklets': 'BA',
      'bridal toe rings': 'BTR',
      'bridal_toe_rings': 'BTR',
      'daily wear toe rings': 'DTR',
      'daily_wear_toe_rings': 'DTR'
    },
    'brooches & pins': {
      'saree pins': 'SP',
      'saree_pins': 'SP',
      'suit brooches': 'SB',
      'suit_brooches': 'SB',
      'bridal brooches': 'BB',
      'bridal_brooches': 'BB',
      'cufflinks': 'CLF',
      'tie pins': 'TP',
      'tie_pins': 'TP'
    },
    'kids jewellery': {
      'baby bangles': 'BBG',
      'baby_bangles': 'BBG',
      'nazariya bracelets': 'NZB',
      'nazariya_bracelets': 'NZB',
      'kids earrings': 'KER',
      'kids_earrings': 'KER',
      'kids chains': 'KCH',
      'kids_chains': 'KCH',
      'kids rings': 'KRG',
      'kids_rings': 'KRG'
    },
    'bridal & special collections': {
      'bridal sets': 'BDS',
      'bridal_sets': 'BDS',
      'temple jewellery sets': 'TJS',
      'temple_jewellery_sets': 'TJS',
      'antique jewellery collections': 'AJC',
      'antique_jewellery_collections': 'AJC',
      'custom made jewellery': 'CMJ',
      'custom_made_jewellery': 'CMJ'
    },
    'shop by material / gemstone': {
      'gold jewellery 22k 18k 14k': 'GLD',
      'gold_jewellery_22k_18k_14k': 'GLD',
      'silver jewellery sterling oxidized': 'SLV',
      'silver_jewellery_sterling_oxidized': 'SLV',
      'platinum jewellery': 'PLT',
      'platinum_jewellery': 'PLT',
      'diamond jewellery': 'DMJ',
      'diamond_jewellery': 'DMJ',
      'gemstone jewellery': 'GSJ',
      'gemstone_jewellery': 'GSJ',
      'pearl jewellery': 'PRJ',
      'pearl_jewellery': 'PRJ',
      'fashion artificial jewellery': 'FAJ',
      'fashion_artificial_jewellery': 'FAJ'
    },
    'material': {
      'gold jewellery 22k 18k 14k': 'GLD',
      'gold_jewellery_22k_18k_14k': 'GLD',
      'silver jewellery sterling oxidized': 'SLV',
      'silver_jewellery_sterling_oxidized': 'SLV',
      'platinum jewellery': 'PLT',
      'platinum_jewellery': 'PLT',
      'diamond jewellery': 'DMJ',
      'diamond_jewellery': 'DMJ',
      'gemstone jewellery': 'GSJ',
      'gemstone_jewellery': 'GSJ',
      'pearl jewellery': 'PRJ',
      'pearl_jewellery': 'PRJ',
      'fashion artificial jewellery': 'FAJ',
      'fashion_artificial_jewellery': 'FAJ'
    }
  };
  
  const categoryMapping = subCategoryMappings[categoryKey];
  if (categoryMapping && categoryMapping[subCategoryKey]) {
    return categoryMapping[subCategoryKey];
  }
  
  // Fallback: create abbreviation from subcategory name
  return subCategory
    .replace(/[^a-zA-Z\s]/g, '')
    .split(' ')
    .map(word => word.substring(0, 3).toUpperCase())
    .join('')
    .substring(0, 4);
}

export function formatProductDataForBarcode(data: ProductBarcodeData): string {
  return JSON.stringify({
    code: data.productCode,
    name: data.productName,
    purity: data.purity,
    grossWeight: data.grossWeight,
    netWeight: data.netWeight,
    stones: data.stones,
    goldRate: data.goldRate,
    price: data.approxPrice
  });
}

export async function generateBarcode(data: string, productCode: string): Promise<{ barcode: string, imagePath: string }> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'barcodes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // For now, just return the product code without file I/O for better performance
    // The actual barcode rendering will be done on the frontend
    const filename = `barcode-${productCode.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.txt`;
    
    // Skip file writing for better performance - return virtual path
    return {
      barcode: productCode,
      imagePath: `/uploads/barcodes/${filename}`
    };
  } catch (error) {
    console.error('Error generating barcode:', error);
    // Return a simple fallback
    return {
      barcode: productCode,
      imagePath: ''
    };
  }
}

export async function generateQRCode(data: ProductBarcodeData, productCode: string): Promise<string> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'qrcodes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Format data for QR code - text only, no URLs
    const qrData = `🏷️ PALANIAPPA JEWELLERS
📋 Product Code: ${data.productCode}
💍 Product Name: ${data.productName}
⚖️ Purity: ${data.purity}
📊 Gross Weight: ${data.grossWeight}
📈 Net Weight: ${data.netWeight}
💎 Stone: ${data.stones}
📉 Gold Rate: ${data.goldRate}
💰 Approx Price: ${data.approxPrice}

📞 Contact: +91 994 206 1393
💬 WhatsApp: +91 994 206 1393`;

    // Generate QR code
    const filename = `qr-${productCode.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.png`;
    const imagePath = path.join(uploadsDir, filename);
    
    await QRCode.toFile(imagePath, qrData, {
      width: 200,
      margin: 4,
      color: {
        dark: '#000000',  // Black dots
        light: '#FFFFFF'  // White background
      },
      errorCorrectionLevel: 'H', // High error correction for better print quality
      type: 'png',
      scale: 8  // Higher scale for crisp printing
    });

    return `/uploads/qrcodes/${filename}`;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function parseProductFromBarcode(barcodeData: string): ProductBarcodeData | null {
  try {
    const parsed = JSON.parse(barcodeData);
    return {
      productCode: parsed.code,
      productName: parsed.name,
      purity: parsed.purity,
      grossWeight: parsed.grossWeight,
      netWeight: parsed.netWeight,
      stones: parsed.stones,
      goldRate: parsed.goldRate,
      approxPrice: parsed.price
    };
  } catch (error) {
    console.error('Error parsing barcode data:', error);
    return null;
  }
}