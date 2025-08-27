import { users, products, bills, cartItems, orders, estimates, categories, homeSections, homeSectionItems, shippingZones, shippingMethods, shipments, deliveryAttempts, type User, type InsertUser, type Product, type InsertProduct, type Bill, type InsertBill, type CartItemRow, type InsertCartItem, type Order, type InsertOrder, type CartItem, type Estimate, type InsertEstimate, type Category, type InsertCategory, type HomeSection, type InsertHomeSection, type HomeSectionItem, type InsertHomeSectionItem, type ShippingZone, type ShippingMethod, type Shipment, type DeliveryAttempt } from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and, gte, lte, isNull, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(email: string, password: string): Promise<User | null>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: string, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User | undefined>;
  
  // OTP operations for forgot password
  updateUserOtp(userId: string, otpCode: string, otpExpiry: Date): Promise<User | undefined>;
  updateUserOtpVerified(userId: string, verified: boolean): Promise<User | undefined>;
  updateUserPassword(userId: string, newPassword: string): Promise<User | undefined>;
  clearUserOtp(userId: string): Promise<User | undefined>;

  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  searchProducts(query: string, filters?: ProductFilters): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Cart operations
  getCartItems(sessionId?: string, userId?: string): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItemRow>;
  updateCartItem(id: string, quantity: number): Promise<CartItemRow | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(sessionId?: string, userId?: string): Promise<boolean>;

  // Order operations
  getAllOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updatePaymentStatus(id: string, status: string, paymentIntentId?: string): Promise<Order | undefined>;

  // Bill operations (for admin billing)
  getAllBills(): Promise<Bill[]>;
  getBill(id: string): Promise<Bill | undefined>;
  getBillById(id: string): Promise<Bill | undefined>;
  getBillByNumber(billNumber: string): Promise<Bill | undefined>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBill(id: string, bill: Partial<InsertBill>): Promise<Bill | undefined>;
  searchBills(query: string): Promise<Bill[]>;
  getBillsByDateRange(startDate: Date, endDate: Date): Promise<Bill[]>;

  // Estimate operations
  getAllEstimates(): Promise<Estimate[]>;
  getEstimate(id: string): Promise<Estimate | undefined>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: string, estimate: Partial<InsertEstimate>): Promise<Estimate | undefined>;

  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategoriesHierarchy(): Promise<CategoryWithChildren[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getMainCategories(): Promise<Category[]>; // Categories without parent
  getSubCategories(parentId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  reorderCategories(categoryIds: string[]): Promise<boolean>;

  // Home Section operations
  getAllHomeSections(): Promise<HomeSectionWithItems[]>;
  getAllHomeSectionsForAdmin(): Promise<HomeSectionWithItems[]>;
  getHomeSection(id: string): Promise<HomeSectionWithItems | undefined>;
  createHomeSection(section: InsertHomeSection): Promise<HomeSection>;
  updateHomeSection(id: string, section: Partial<InsertHomeSection>): Promise<HomeSection | undefined>;
  deleteHomeSection(id: string): Promise<boolean>;
  
  // Home Section Item operations
  getHomeSectionItems(sectionId: string): Promise<HomeSectionItemWithProduct[]>;
  addHomeSectionItem(item: InsertHomeSectionItem): Promise<HomeSectionItem>;
  updateHomeSectionItem(itemId: string, item: Partial<InsertHomeSectionItem>): Promise<HomeSectionItem | undefined>;
  deleteHomeSectionItem(itemId: string): Promise<boolean>;

  // Shipping Zone operations
  getAllShippingZones(): Promise<ShippingZone[]>;
  getShippingZone(id: string): Promise<ShippingZone | undefined>;
  createShippingZone(zone: Partial<ShippingZone>): Promise<ShippingZone>;
  updateShippingZone(id: string, zone: Partial<ShippingZone>): Promise<ShippingZone | undefined>;
  deleteShippingZone(id: string): Promise<boolean>;

  // Shipping Method operations
  getAllShippingMethods(): Promise<ShippingMethod[]>;
  getShippingMethodsByZone(zoneId: string): Promise<ShippingMethod[]>;
  getShippingMethodsByCountry(country: string): Promise<ShippingMethod[]>;
  getShippingMethod(id: string): Promise<ShippingMethod | undefined>;
  createShippingMethod(method: Partial<ShippingMethod>): Promise<ShippingMethod>;
  updateShippingMethod(id: string, method: Partial<ShippingMethod>): Promise<ShippingMethod | undefined>;
  deleteShippingMethod(id: string): Promise<boolean>;

  // Shipment operations
  getAllShipments(): Promise<Shipment[]>;
  getShipment(id: string): Promise<Shipment | undefined>;
  getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment | undefined>;
  getShipmentsByOrder(orderId: string): Promise<Shipment[]>;
  createShipment(shipment: Partial<Shipment>): Promise<Shipment>;
  updateShipment(id: string, shipment: Partial<Shipment>): Promise<Shipment | undefined>;
  updateShipmentStatus(id: string, status: string, trackingEvents?: any[]): Promise<Shipment | undefined>;

  // Delivery Attempt operations
  getDeliveryAttempts(shipmentId: string): Promise<DeliveryAttempt[]>;
  createDeliveryAttempt(attempt: Partial<DeliveryAttempt>): Promise<DeliveryAttempt>;
  updateDeliveryAttempt(id: string, attempt: Partial<DeliveryAttempt>): Promise<DeliveryAttempt | undefined>;

  // Shipping Calculation
  calculateShippingCost(country: string, weight: number, value: number, currency: string): Promise<{cost: number, methods: ShippingMethod[]}>;
}

export interface CategoryWithChildren extends Category {
  children?: Category[];
}

export interface HomeSectionWithItems extends HomeSection {
  items: HomeSectionItemWithProduct[];
}

export interface HomeSectionItemWithProduct extends HomeSectionItem {
  product: Product;
}

export interface ProductFilters {
  category?: string;
  subCategory?: string;
  material?: string;
  priceMin?: number;
  priceMax?: number;
  gender?: string;
  occasion?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: { customerId: string; subscriptionId: string }): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        stripeCustomerId: stripeInfo.customerId,
        stripeSubscriptionId: stripeInfo.subscriptionId 
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  // OTP operations for forgot password
  async updateUserOtp(userId: string, otpCode: string, otpExpiry: Date): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        otpCode: otpCode,
        otpExpiry: otpExpiry,
        otpVerified: false 
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserOtpVerified(userId: string, verified: boolean): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ otpVerified: verified })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<User | undefined> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [updatedUser] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async clearUserOtp(userId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        otpCode: null,
        otpExpiry: null,
        otpVerified: false 
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }


  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(and(eq(products.id, id), eq(products.isActive, true)));
    return product || undefined;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(and(eq(products.category, category), eq(products.isActive, true))).orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values({
        ...product,
        isActive: product.isActive ?? true
      })
      .returning();
    return newProduct;
  }


  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const [deletedProduct] = await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id))
      .returning();
    return !!deletedProduct;
  }

  // Bill operations
  // async getAllBills(): Promise<Bill[]> {
  //   return await db
  //     .selectFrom('bills')
  //     .select('*')
  //     .orderBy('created_at', 'desc')
  //     .execute()
  // }  // <- missing semicolon or closing bracket for previous method
  // getBill(id: string): Promise<Bill | undefined> {
  // ...
  // }


  // async getBill(id: string): Promise<Bill | undefined> {
  //   const [bill] = await db.select().from(bills).where(eq(bills.id, id));
  //   return bill || undefined;
  // }
  async getAllBills(): Promise<Bill[]> {
    return await db
      .select()
      .from(bills)
      .orderBy('created_at', 'desc');
  }

  async getBill(id: string): Promise<Bill | undefined> {
    const [bill] = await db
      .select()
      .from(bills)
      .where(eq(bills.id, id));
    return bill;
  }

  async getBillById(id: string): Promise<Bill | undefined> {
    const [bill] = await db
      .select()
      .from(bills)
      .where(eq(bills.id, id));
    return bill;
  }

  async updateBill(id: string, billData: Partial<InsertBill>): Promise<Bill | undefined> {
    const total = Number(billData.subtotal || 0) + Number(billData.makingCharges || 0) + Number(billData.gst || 0) - Number(billData.discount || 0);
    
    const [updatedBill] = await db
      .update(bills)
      .set({
        ...billData,
        total,
        updatedAt: new Date(),
      })
      .where(eq(bills.id, id))
      .returning();
    
    return updatedBill;
  }


  async createBill(bill: InsertBill): Promise<Bill> {
    const total = Number(bill.subtotal) + Number(bill.makingCharges) + Number(bill.gst) - Number(bill.discount || 0);

    // Insert bill into database
    const result = await db
      .insert(bills)
      .values({
        ...bill,
        total: total.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Return the first item from the array
    return result[0] as Bill;
  }



  async getBillByNumber(billNumber: string): Promise<Bill | undefined> {
    const [bill] = await db
      .select()
      .from(bills)
      .where(eq(bills.billNumber, billNumber));
    return bill;
  }

  // async createBill(bill: InsertBill): Promise<Bill> {
  //   const [newBill] = await db
  //     .insert(bills)
  //     .values({
  //       ...bill,
  //       created_at: new Date(),
  //       updated_at: new Date()
  //     })
  //     .returning();
  //   return newBill;
  // }


  async searchBills(query: string): Promise<Bill[]> {
    return await db.select().from(bills).where(
      like(bills.customerName, `%${query}%`)
    ).orderBy(desc(bills.createdAt));
  }

  async getBillsByDateRange(startDate: Date, endDate: Date): Promise<Bill[]> {
    return await db.select().from(bills).where(
      and(
        eq(bills.createdAt, startDate),
        eq(bills.createdAt, endDate)
      )
    ).orderBy(desc(bills.createdAt));
  }

  // Estimate operations
  async getAllEstimates(): Promise<Estimate[]> {
    return db.select().from(estimates).orderBy(desc(estimates.createdAt));
  }

  async getEstimate(id: string): Promise<Estimate | undefined> {
    const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id));
    return estimate || undefined;
  }

  async createEstimate(insertEstimate: InsertEstimate): Promise<Estimate> {
    // Generate quotation number in format: PJ-QTN-YYYY-MM-NNN
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Count estimates created in current month to get sequential number
    const startOfMonth = new Date(year, now.getMonth(), 1);
    const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const monthlyEstimates = await db
      .select()
      .from(estimates)
      .where(
        and(
          gte(estimates.createdAt, startOfMonth),
          lte(estimates.createdAt, endOfMonth)
        )
      );
    
    const sequentialNumber = String(monthlyEstimates.length + 1).padStart(3, '0');
    const quotationNo = `PJ-QTN-${year}-${month}-${sequentialNumber}`;
    
    // Ensure validUntil is a proper Date object
    const estimateData = {
      ...insertEstimate,
      quotationNo,
      validUntil: insertEstimate.validUntil instanceof Date 
        ? insertEstimate.validUntil 
        : new Date(insertEstimate.validUntil as string),
    };
    
    const [estimate] = await db
      .insert(estimates)
      .values(estimateData)
      .returning();
    return estimate;
  }

  async updateEstimate(id: string, updateData: Partial<InsertEstimate>): Promise<Estimate> {
    // Ensure validUntil is a proper Date object if provided
    const estimateData = {
      ...updateData,
      ...(updateData.validUntil && {
        validUntil: updateData.validUntil instanceof Date 
          ? updateData.validUntil 
          : new Date(updateData.validUntil as string),
      }),
      updatedAt: new Date(),
    };
    
    const [estimate] = await db
      .update(estimates)
      .set(estimateData)
      .where(eq(estimates.id, id))
      .returning();
    
    if (!estimate) {
      throw new Error('Estimate not found');
    }
    
    return estimate;
  }


  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.displayOrder, categories.name);
  }

  async getCategoriesHierarchy(): Promise<CategoryWithChildren[]> {
    const allCategories = await this.getAllCategories();
    const mainCategories = allCategories.filter(cat => !cat.parentId);
    
    return mainCategories.map(mainCat => ({
      ...mainCat,
      children: allCategories.filter(cat => cat.parentId === mainCat.id)
    }));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  async getMainCategories(): Promise<Category[]> {
    return db.select().from(categories)
      .where(isNull(categories.parentId))
      .orderBy(categories.displayOrder, categories.name);
  }

  async getSubCategories(parentId: string): Promise<Category[]> {
    return db.select().from(categories)
      .where(eq(categories.parentId, parentId))
      .orderBy(categories.displayOrder, categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values({
        ...category,
        updatedAt: new Date()
      })
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    // First check if category has children
    const children = await this.getSubCategories(id);
    if (children.length > 0) {
      return false; // Cannot delete category with children
    }

    // Check if category is used by products
    const productsUsingCategory = await db.select().from(products)
      .where(eq(products.category, (await this.getCategory(id))?.slug || ''));
    
    if (productsUsingCategory.length > 0) {
      return false; // Cannot delete category used by products
    }

    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  async reorderCategories(categoryIds: string[]): Promise<boolean> {
    try {
      for (let i = 0; i < categoryIds.length; i++) {
        await db
          .update(categories)
          .set({ displayOrder: i, updatedAt: new Date() })
          .where(eq(categories.id, categoryIds[i]));
      }
      return true;
    } catch (error) {
      console.error('Error reordering categories:', error);
      return false;
    }
  }

  // ==============================
  // HOME SECTION OPERATIONS
  // ==============================

  async getAllHomeSections(): Promise<HomeSectionWithItems[]> {
    const sections = await db
      .select()
      .from(homeSections)
      .where(eq(homeSections.isActive, true))
      .orderBy(homeSections.displayOrder, homeSections.createdAt);

    const sectionsWithItems: HomeSectionWithItems[] = [];
    
    for (const section of sections) {
      const items = await this.getHomeSectionItems(section.id);
      sectionsWithItems.push({
        ...section,
        items
      });
    }

    return sectionsWithItems;
  }

  async getAllHomeSectionsForAdmin(): Promise<HomeSectionWithItems[]> {
    const sections = await db
      .select()
      .from(homeSections)
      .orderBy(homeSections.displayOrder, homeSections.createdAt);

    const sectionsWithItems: HomeSectionWithItems[] = [];
    
    for (const section of sections) {
      const items = await this.getHomeSectionItems(section.id);
      sectionsWithItems.push({
        ...section,
        items
      });
    }

    return sectionsWithItems;
  }

  async getHomeSection(id: string): Promise<HomeSectionWithItems | undefined> {
    const [section] = await db
      .select()
      .from(homeSections)
      .where(eq(homeSections.id, id));

    if (!section) return undefined;

    const items = await this.getHomeSectionItems(id);
    return {
      ...section,
      items
    };
  }

  async createHomeSection(sectionData: InsertHomeSection): Promise<HomeSection> {
    const [section] = await db
      .insert(homeSections)
      .values({
        ...sectionData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return section;
  }

  async updateHomeSection(id: string, updateData: Partial<InsertHomeSection>): Promise<HomeSection | undefined> {
    const [section] = await db
      .update(homeSections)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(homeSections.id, id))
      .returning();
    return section || undefined;
  }

  async deleteHomeSection(id: string): Promise<boolean> {
    // First delete all items in the section
    await db.delete(homeSectionItems).where(eq(homeSectionItems.sectionId, id));
    
    // Then delete the section
    const result = await db.delete(homeSections).where(eq(homeSections.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getHomeSectionItems(sectionId: string): Promise<HomeSectionItemWithProduct[]> {
    const items = await db
      .select({
        id: homeSectionItems.id,
        sectionId: homeSectionItems.sectionId,
        productId: homeSectionItems.productId,
        displayName: homeSectionItems.displayName,
        displayPrice: homeSectionItems.displayPrice,
        displayPriceInr: homeSectionItems.displayPriceInr,
        displayPriceBhd: homeSectionItems.displayPriceBhd,
        position: homeSectionItems.position,
        size: homeSectionItems.size,
        createdAt: homeSectionItems.createdAt,
        product: products
      })
      .from(homeSectionItems)
      .innerJoin(products, eq(homeSectionItems.productId, products.id))
      .where(eq(homeSectionItems.sectionId, sectionId))
      .orderBy(homeSectionItems.position);

    return items;
  }

  async addHomeSectionItem(itemData: InsertHomeSectionItem): Promise<HomeSectionItem> {
    const [item] = await db
      .insert(homeSectionItems)
      .values({
        ...itemData,
        createdAt: new Date()
      })
      .returning();
    return item;
  }

  async updateHomeSectionItem(itemId: string, updateData: Partial<InsertHomeSectionItem>): Promise<HomeSectionItem | undefined> {
    const [item] = await db
      .update(homeSectionItems)
      .set(updateData)
      .where(eq(homeSectionItems.id, itemId))
      .returning();
    return item || undefined;
  }

  async deleteHomeSectionItem(itemId: string): Promise<boolean> {
    const result = await db.delete(homeSectionItems).where(eq(homeSectionItems.id, itemId));
    return (result.rowCount || 0) > 0;
  }

  // Shipping Zone operations
  async getAllShippingZones(): Promise<ShippingZone[]> {
    return await db.select().from(shippingZones).where(eq(shippingZones.isActive, true));
  }

  async getShippingZone(id: string): Promise<ShippingZone | undefined> {
    const [zone] = await db.select().from(shippingZones).where(eq(shippingZones.id, id));
    return zone || undefined;
  }

  async createShippingZone(zone: Partial<ShippingZone>): Promise<ShippingZone> {
    const [newZone] = await db.insert(shippingZones).values(zone as any).returning();
    return newZone;
  }

  async updateShippingZone(id: string, zone: Partial<ShippingZone>): Promise<ShippingZone | undefined> {
    const [updatedZone] = await db.update(shippingZones)
      .set(zone as any)
      .where(eq(shippingZones.id, id))
      .returning();
    return updatedZone || undefined;
  }

  async deleteShippingZone(id: string): Promise<boolean> {
    const result = await db.delete(shippingZones).where(eq(shippingZones.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Shipping Method operations
  async getAllShippingMethods(): Promise<ShippingMethod[]> {
    return await db.select().from(shippingMethods).where(eq(shippingMethods.isActive, true));
  }

  async getShippingMethodsByZone(zoneId: string): Promise<ShippingMethod[]> {
    return await db.select().from(shippingMethods)
      .where(and(eq(shippingMethods.zoneId, zoneId), eq(shippingMethods.isActive, true)));
  }

  async getShippingMethodsByCountry(country: string): Promise<ShippingMethod[]> {
    const zones = await db.select().from(shippingZones).where(eq(shippingZones.isActive, true));
    const matchingZones = zones.filter(zone => 
      zone.countries && Array.isArray(zone.countries) && zone.countries.includes(country)
    );
    
    if (matchingZones.length === 0) return [];
    
    const zoneIds = matchingZones.map(zone => zone.id);
    return await db.select().from(shippingMethods)
      .where(and(
        eq(shippingMethods.isActive, true),
        or(...zoneIds.map(id => eq(shippingMethods.zoneId, id)))
      ));
  }

  async getShippingMethod(id: string): Promise<ShippingMethod | undefined> {
    const [method] = await db.select().from(shippingMethods).where(eq(shippingMethods.id, id));
    return method || undefined;
  }

  async createShippingMethod(method: Partial<ShippingMethod>): Promise<ShippingMethod> {
    const [newMethod] = await db.insert(shippingMethods).values(method as any).returning();
    return newMethod;
  }

  async updateShippingMethod(id: string, method: Partial<ShippingMethod>): Promise<ShippingMethod | undefined> {
    const [updatedMethod] = await db.update(shippingMethods)
      .set(method as any)
      .where(eq(shippingMethods.id, id))
      .returning();
    return updatedMethod || undefined;
  }

  async deleteShippingMethod(id: string): Promise<boolean> {
    const result = await db.delete(shippingMethods).where(eq(shippingMethods.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Shipment operations
  async getAllShipments(): Promise<Shipment[]> {
    return await db.select().from(shipments).orderBy(desc(shipments.createdAt));
  }

  async getShipment(id: string): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.id, id));
    return shipment || undefined;
  }

  async getShipmentByTrackingNumber(trackingNumber: string): Promise<Shipment | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.trackingNumber, trackingNumber));
    return shipment || undefined;
  }

  async getShipmentsByOrder(orderId: string): Promise<Shipment[]> {
    return await db.select().from(shipments).where(eq(shipments.orderId, orderId));
  }

  async createShipment(shipment: Partial<Shipment>): Promise<Shipment> {
    if (!shipment.trackingNumber) {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      shipment.trackingNumber = `PJ${timestamp}${random}`;
    }

    const [newShipment] = await db.insert(shipments).values(shipment as any).returning();
    return newShipment;
  }

  async updateShipment(id: string, shipment: Partial<Shipment>): Promise<Shipment | undefined> {
    const [updatedShipment] = await db.update(shipments)
      .set({ ...shipment, updatedAt: new Date() } as any)
      .where(eq(shipments.id, id))
      .returning();
    return updatedShipment || undefined;
  }

  async updateShipmentStatus(id: string, status: string, trackingEvents?: any[]): Promise<Shipment | undefined> {
    const updateData: any = { status, updatedAt: new Date(), lastTrackingUpdate: new Date() };
    if (trackingEvents) {
      updateData.trackingEvents = trackingEvents;
    }

    const [updatedShipment] = await db.update(shipments)
      .set(updateData)
      .where(eq(shipments.id, id))
      .returning();
    return updatedShipment || undefined;
  }

  // Delivery Attempt operations
  async getDeliveryAttempts(shipmentId: string): Promise<DeliveryAttempt[]> {
    return await db.select().from(deliveryAttempts)
      .where(eq(deliveryAttempts.shipmentId, shipmentId))
      .orderBy(desc(deliveryAttempts.attemptDate));
  }

  async createDeliveryAttempt(attempt: Partial<DeliveryAttempt>): Promise<DeliveryAttempt> {
    const [newAttempt] = await db.insert(deliveryAttempts).values(attempt as any).returning();
    return newAttempt;
  }

  async updateDeliveryAttempt(id: string, attempt: Partial<DeliveryAttempt>): Promise<DeliveryAttempt | undefined> {
    const [updatedAttempt] = await db.update(deliveryAttempts)
      .set(attempt as any)
      .where(eq(deliveryAttempts.id, id))
      .returning();
    return updatedAttempt || undefined;
  }

  // Shipping Calculation
  async calculateShippingCost(country: string, weight: number, value: number, currency: string): Promise<{cost: number, methods: ShippingMethod[]}> {
    const methods = await this.getShippingMethodsByCountry(country);
    
    const calculatedMethods = methods.map(method => {
      const baseCost = parseFloat(method.baseCost);
      const perKgCost = parseFloat(method.perKgCost || "0");
      const freeThreshold = method.freeShippingThreshold ? parseFloat(method.freeShippingThreshold) : null;
      
      let cost = baseCost + (weight * perKgCost);
      
      if (freeThreshold && value >= freeThreshold) {
        cost = 0;
      }
      
      if (method.currency !== currency) {
        if (method.currency === "INR" && currency === "BHD") {
          cost = cost * 0.0125;
        } else if (method.currency === "BHD" && currency === "INR") {
          cost = cost * 80;
        }
      }
      
      return { ...method, calculatedCost: cost };
    });
    
    const lowestCost = calculatedMethods.length > 0 ? Math.min(...calculatedMethods.map(m => m.calculatedCost || 0)) : 0;
    
    return {
      cost: lowestCost,
      methods: calculatedMethods
    };
  }
}

export const storage = new DatabaseStorage();
