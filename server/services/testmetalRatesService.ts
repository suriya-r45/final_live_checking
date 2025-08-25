import { db } from "../db";
import { metalRates } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class MetalRatesService {
  // Static metal rates (no API calls)
  private static STATIC_RATES = {
    chennai: {
      gold_22k: 6563,  // INR per gram
      gold_18k: 5372,  // INR per gram  
      silver: 95       // INR per gram
    },
    bahrain: {
      gold_22k: 28.228, // BHD per gram
      gold_18k: 23.090, // BHD per gram
      silver: 1.25      // BHD per gram
    }
  };

  static async upsertRate(rateData: {
    metal: "GOLD" | "SILVER";
    purity: string;
    pricePerGramInr: string;
    pricePerGramBhd: string;
    pricePerGramUsd: string;
    market: "INDIA" | "BAHRAIN";
    source: string;
  }) {
    try {
      const existingRate = await db
        .select()
        .from(metalRates)
        .where(
          and(
            eq(metalRates.metal, rateData.metal),
            eq(metalRates.purity, rateData.purity),
            eq(metalRates.market, rateData.market)
          )
        )
        .limit(1);

      if (existingRate.length > 0) {
        await db
          .update(metalRates)
          .set({
            pricePerGramInr: rateData.pricePerGramInr,
            pricePerGramBhd: rateData.pricePerGramBhd,
            pricePerGramUsd: rateData.pricePerGramUsd,
            source: rateData.source,
            lastUpdated: new Date()
          })
          .where(eq(metalRates.id, existingRate[0].id));
      } else {
        await db.insert(metalRates).values({
          metal: rateData.metal,
          purity: rateData.purity,
          pricePerGramInr: rateData.pricePerGramInr,
          pricePerGramBhd: rateData.pricePerGramBhd,
          pricePerGramUsd: rateData.pricePerGramUsd,
          market: rateData.market,
          source: rateData.source,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error("Error upserting metal rate:", error);
    }
  }

  static async initializeFallbackRates() {
    try {
      const exchangeRates = { INR: 83.5, BHD: 0.376 };

      const updatePromises = [
        // CHENNAI/INDIA - Gold 22K
        this.upsertRate({
          metal: "GOLD",
          purity: "22K",
          pricePerGramInr: this.STATIC_RATES.chennai.gold_22k.toString(),
          pricePerGramBhd: (this.STATIC_RATES.chennai.gold_22k / (exchangeRates.INR / exchangeRates.BHD)).toFixed(3),
          pricePerGramUsd: (this.STATIC_RATES.chennai.gold_22k / exchangeRates.INR).toFixed(2),
          market: "INDIA",
          source: "Static Chennai Market Data - " + new Date().toLocaleDateString()
        }),
        // CHENNAI/INDIA - Gold 18K
        this.upsertRate({
          metal: "GOLD",
          purity: "18K",
          pricePerGramInr: this.STATIC_RATES.chennai.gold_18k.toString(),
          pricePerGramBhd: (this.STATIC_RATES.chennai.gold_18k / (exchangeRates.INR / exchangeRates.BHD)).toFixed(3),
          pricePerGramUsd: (this.STATIC_RATES.chennai.gold_18k / exchangeRates.INR).toFixed(2),
          market: "INDIA",
          source: "Static Chennai Market Data - " + new Date().toLocaleDateString()
        }),
        // CHENNAI/INDIA - Silver 925
        this.upsertRate({
          metal: "SILVER",
          purity: "925",
          pricePerGramInr: this.STATIC_RATES.chennai.silver.toString(),
          pricePerGramBhd: (this.STATIC_RATES.chennai.silver / (exchangeRates.INR / exchangeRates.BHD)).toFixed(3),
          pricePerGramUsd: (this.STATIC_RATES.chennai.silver / exchangeRates.INR).toFixed(2),
          market: "INDIA",
          source: "Static Chennai Market Data - " + new Date().toLocaleDateString()
        }),
        // BAHRAIN - Gold 22K
        this.upsertRate({
          metal: "GOLD",
          purity: "22K",
          pricePerGramInr: (this.STATIC_RATES.bahrain.gold_22k * (exchangeRates.INR / exchangeRates.BHD)).toFixed(0),
          pricePerGramBhd: this.STATIC_RATES.bahrain.gold_22k.toString(),
          pricePerGramUsd: (this.STATIC_RATES.bahrain.gold_22k / exchangeRates.BHD).toFixed(2),
          market: "BAHRAIN",
          source: "Static Bahrain Market Data - " + new Date().toLocaleDateString()
        }),
        // BAHRAIN - Gold 18K
        this.upsertRate({
          metal: "GOLD",
          purity: "18K",
          pricePerGramInr: (this.STATIC_RATES.bahrain.gold_18k * (exchangeRates.INR / exchangeRates.BHD)).toFixed(0),
          pricePerGramBhd: this.STATIC_RATES.bahrain.gold_18k.toString(),
          pricePerGramUsd: (this.STATIC_RATES.bahrain.gold_18k / exchangeRates.BHD).toFixed(2),
          market: "BAHRAIN",
          source: "Static Bahrain Market Data - " + new Date().toLocaleDateString()
        }),
        // BAHRAIN - Silver 925
        this.upsertRate({
          metal: "SILVER",
          purity: "925",
          pricePerGramInr: (this.STATIC_RATES.bahrain.silver * (exchangeRates.INR / exchangeRates.BHD)).toFixed(0),
          pricePerGramBhd: this.STATIC_RATES.bahrain.silver.toString(),
          pricePerGramUsd: (this.STATIC_RATES.bahrain.silver / exchangeRates.BHD).toFixed(2),
          market: "BAHRAIN",
          source: "Static Bahrain Market Data - " + new Date().toLocaleDateString()
        })
      ];

      await Promise.all(updatePromises);
      console.log("✅ Static metal rates initialized successfully!");
    } catch (error) {
      console.error("❌ Error initializing static metal rates:", error);
    }
  }

  static async getCurrentRates() {
    return this.STATIC_RATES;
  }

  static async getAllRatesFromDB() {
    try {
      return await db.select().from(metalRates);
    } catch (error) {
      console.error("Error fetching rates from database:", error);
      return [];
    }
  }

  static async getLatestRates(market?: "INDIA" | "BAHRAIN") {
    try {
      if (market) {
        return await db.select().from(metalRates).where(eq(metalRates.market, market));
      }
      return await db.select().from(metalRates);
    } catch (error) {
      console.error("Error fetching metal rates:", error);
      return [];
    }
  }

  // Initialize static rates once
  static async initializeRates() {
    try {
      console.log("🔧 Initializing static metal rates...");
      await this.initializeFallbackRates();
      console.log("✅ Static metal rates loaded");
    } catch (error) {
      console.error("Failed to initialize static metal rates:", error);
    }
  }

  // No scheduled updates - rates are now static
  static startScheduledUpdates() {
    console.log("📌 Metal rates are now static (no live updates)");
  }
}