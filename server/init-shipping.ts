import { db } from "./db";
import { shippingZones, shippingMethods } from "@shared/schema";

async function initializeShippingData() {
  try {
    // Check if shipping zones already exist
    const existingZones = await db.select().from(shippingZones);
    if (existingZones.length > 0) {
      console.log('Shipping zones already initialized');
      return;
    }

    console.log('🚚 Initializing shipping zones and methods...');

    // Create shipping zones
    const [indiaZone] = await db.insert(shippingZones).values({
      name: "India Domestic",
      countries: ["IN"],
      isActive: true
    }).returning();

    const [bahrainZone] = await db.insert(shippingZones).values({
      name: "Bahrain",
      countries: ["BH"],
      isActive: true
    }).returning();

    const [gccZone] = await db.insert(shippingZones).values({
      name: "GCC Countries",
      countries: ["AE", "SA", "KW", "QA", "OM"],
      isActive: true
    }).returning();

    const [internationalZone] = await db.insert(shippingZones).values({
      name: "International",
      countries: ["US", "CA", "UK", "AU", "SG", "MY"],
      isActive: true
    }).returning();

    // Create shipping methods for India
    await db.insert(shippingMethods).values([
      {
        zoneId: indiaZone.id,
        name: "Standard Delivery",
        description: "3-5 business days delivery",
        carrier: "Blue Dart",
        estimatedDays: 4,
        maxDays: 7,
        baseCost: "250.00",
        perKgCost: "50.00",
        freeShippingThreshold: "10000.00",
        currency: "INR",
        trackingAvailable: true,
        signatureRequired: true,
        insuranceIncluded: true,
        maxWeight: "5.00",
        isActive: true
      },
      {
        zoneId: indiaZone.id,
        name: "Express Delivery",
        description: "1-2 business days delivery",
        carrier: "Blue Dart",
        estimatedDays: 2,
        maxDays: 3,
        baseCost: "500.00",
        perKgCost: "100.00",
        freeShippingThreshold: "25000.00",
        currency: "INR",
        trackingAvailable: true,
        signatureRequired: true,
        insuranceIncluded: true,
        maxWeight: "5.00",
        isActive: true
      }
    ]);

    // Create shipping methods for Bahrain
    await db.insert(shippingMethods).values([
      {
        zoneId: bahrainZone.id,
        name: "Standard Delivery",
        description: "2-3 business days delivery",
        carrier: "Aramex",
        estimatedDays: 3,
        maxDays: 5,
        baseCost: "5.000",
        perKgCost: "2.000",
        freeShippingThreshold: "200.000",
        currency: "BHD",
        trackingAvailable: true,
        signatureRequired: true,
        insuranceIncluded: true,
        maxWeight: "5.000",
        isActive: true
      },
      {
        zoneId: bahrainZone.id,
        name: "Same Day Delivery",
        description: "Same day delivery in Bahrain",
        carrier: "Talabat",
        estimatedDays: 1,
        maxDays: 1,
        baseCost: "8.000",
        perKgCost: "3.000",
        freeShippingThreshold: "500.000",
        currency: "BHD",
        trackingAvailable: true,
        signatureRequired: true,
        insuranceIncluded: true,
        maxWeight: "3.000",
        isActive: true
      }
    ]);

    // Create shipping methods for GCC
    await db.insert(shippingMethods).values([
      {
        zoneId: gccZone.id,
        name: "GCC Express",
        description: "3-5 business days delivery across GCC",
        carrier: "DHL",
        estimatedDays: 4,
        maxDays: 7,
        baseCost: "15.000",
        perKgCost: "5.000",
        freeShippingThreshold: "300.000",
        currency: "BHD",
        trackingAvailable: true,
        signatureRequired: true,
        insuranceIncluded: true,
        maxWeight: "10.000",
        isActive: true
      }
    ]);

    // Create shipping methods for International
    await db.insert(shippingMethods).values([
      {
        zoneId: internationalZone.id,
        name: "International Standard",
        description: "7-14 business days international delivery",
        carrier: "FedEx",
        estimatedDays: 10,
        maxDays: 14,
        baseCost: "25.000",
        perKgCost: "10.000",
        freeShippingThreshold: "500.000",
        currency: "BHD",
        trackingAvailable: true,
        signatureRequired: true,
        insuranceIncluded: true,
        maxWeight: "20.000",
        isActive: true
      }
    ]);

    console.log('✅ Shipping zones and methods initialized successfully!');
  } catch (error) {
    console.error('❌ Error initializing shipping data:', error);
  }
}

// Auto-initialize if this file is run directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === __filename;

if (isMain) {
  initializeShippingData().then(() => process.exit(0));
}

export { initializeShippingData };