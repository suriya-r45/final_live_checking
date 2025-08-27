import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertBillSchema, loginSchema, insertUserSchema, insertEstimateSchema, insertCategorySchema, updateCategorySchema, insertHomeSectionSchema, insertHomeSectionItemSchema, insertShippingZoneSchema, insertShippingMethodSchema, insertShipmentSchema, insertDeliveryAttemptSchema, updateShipmentStatusSchema, calculateShippingSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";
import Stripe from "stripe";
import { MetalRatesService } from "./services/testmetalRatesService.js";
import twilio from "twilio";
import { generateProductCode, generateBarcode, generateQRCode, ProductBarcodeData } from "./utils/barcode";

// Initialize Stripe only if key is provided
let stripe: Stripe | undefined;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY not found. Payment features will be disabled.');
}

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Twilio configuration - optional for development
let twilioClient: twilio.Twilio | undefined;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
  console.warn('⚠️  Twilio credentials not found. SMS features will be disabled.');
}

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: "raveena",
  mobile: "9597201554",
  password: "zxcvbnm"
};

// WhatsApp messaging function
async function sendWelcomeWhatsAppMessage(name: string, phone: string) {
  const message = `✨ Welcome, ${name}! You are now part of the Palaniappa Jewellers legacy, where every jewel is crafted for elegance that lasts generations.`;
  
  // Format phone number for WhatsApp (remove any non-numeric characters except +)
  const formattedPhone = phone.replace(/[^\d+]/g, '');
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
  
  // For now, we'll log the message. In production, you would integrate with WhatsApp Business API
  console.log(`WhatsApp welcome message for ${name} (${phone}): ${message}`);
  console.log(`WhatsApp URL: ${whatsappUrl}`);
  
  // Return the URL so it can be used if needed
  return whatsappUrl;
}

async function sendOtpSMS(name: string, phone: string, otp: string) {
  const message = `🔐 Palaniappa Jewellers - Password Reset OTP

Hello ${name}!

Your One-Time Password (OTP) for account verification is: ${otp}

This OTP is valid for 10 minutes only.
Please do not share this OTP with anyone.

If you didn't request this, please ignore this message.

Palaniappa Jewellers
Contact: +919597201554`;

  try {
    // Format phone number (ensure it starts with +)
    let formattedPhone = phone.replace(/[^\d+]/g, '');
    if (!formattedPhone.startsWith('+')) {
      // Add +91 for Indian numbers if no country code
      formattedPhone = '+91' + formattedPhone;
    }
    
    console.log(`[SMS Debug] Original phone: ${phone}, Formatted phone: ${formattedPhone}`);

    if (!twilioClient) {
      console.log('[SMS Debug] Twilio not configured, skipping SMS send');
      return { success: false, error: 'Twilio not configured' };
    }

    const twilioMessage = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`[SMS Sent] OTP ${otp} sent to ${name} (${phone}) - Message SID: ${twilioMessage.sid}`);
    console.log(`[SMS Details] Status: ${twilioMessage.status}, From: ${process.env.TWILIO_PHONE_NUMBER}, To: ${formattedPhone}`);
    
    // Check message status after a brief delay
    setTimeout(async () => {
      try {
        const messageStatus = await twilioClient!.messages(twilioMessage.sid).fetch();
        console.log(`[SMS Status Update] Message ${twilioMessage.sid} status: ${messageStatus.status}, Error: ${messageStatus.errorMessage || 'None'}`);
      } catch (error) {
        console.log(`[SMS Status Error] Could not fetch status: ${error}`);
      }
    }, 5000);
    
    return { success: true, messageSid: twilioMessage.sid };
  } catch (error) {
    console.error(`[SMS Error] Failed to send OTP to ${phone}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

// Multer configuration for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('Login request body:', req.body);
      const { email, password } = loginSchema.parse(req.body);
      console.log('Parsed email:', email, 'password length:', password?.length);

      // Check for admin credentials (email or mobile)
      if ((email === ADMIN_CREDENTIALS.email || email === ADMIN_CREDENTIALS.mobile) && password === ADMIN_CREDENTIALS.password) {
        const token = jwt.sign(
          { id: "admin", email: ADMIN_CREDENTIALS.email, role: "admin", name: "Admin" },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        return res.json({
          user: { id: "admin", email: ADMIN_CREDENTIALS.email, role: "admin", name: "Admin" },
          token
        });
      }

      // Regular user authentication
      const user = await storage.authenticateUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name }, token });
    } catch (error) {
      console.log('Login validation error:', error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);

      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser({
        ...userData,
        role: "guest"
      });

      // Send WhatsApp welcome message if phone number is provided
      if (userData.phone) {
        try {
          await sendWelcomeWhatsAppMessage(userData.name, userData.phone);
        } catch (error) {
          console.error('Failed to send WhatsApp message:', error);
          // Continue with registration even if WhatsApp fails
        }
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ user: { id: user.id, email: user.email, role: user.role, name: user.name }, token });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // OTP routes for forgot password functionality
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone || phone.length < 10) {
        return res.status(400).json({ message: "Valid phone number is required" });
      }

      // Find user by phone number
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ message: "User not found with this phone number" });
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set OTP expiry to 10 minutes from now
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      // Update user with OTP
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);

      // Send OTP via SMS
      const smsResult = await sendOtpSMS(user.name, phone, otpCode);
      if (!smsResult.success) {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to send OTP. Please try again." 
        });
      }

      res.json({ 
        success: true, 
        message: "OTP sent to your phone number via SMS",
        phone: phone,
        // Temporary debug info - remove in production
        debug: process.env.NODE_ENV === 'development' ? { otp: otpCode } : undefined
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { phone, otp } = req.body;
      
      if (!phone || !otp) {
        return res.status(400).json({ message: "Phone number and OTP are required" });
      }

      // Find user by phone number
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if OTP is valid and not expired
      if (!user.otpCode || user.otpCode !== otp) {
        return res.status(401).json({ message: "Invalid OTP" });
      }

      if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return res.status(401).json({ message: "OTP has expired" });
      }

      // Mark OTP as verified
      await storage.updateUserOtpVerified(user.id, true);

      // Generate JWT token for direct login
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        success: true, 
        user: { id: user.id, email: user.email, role: user.role, name: user.name }, 
        token,
        message: "OTP verified successfully, you are now logged in!" 
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { phone, otp, newPassword } = req.body;
      
      if (!phone || !otp || !newPassword) {
        return res.status(400).json({ message: "Phone number, OTP, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Find user by phone number
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if OTP is valid and verified
      if (!user.otpCode || user.otpCode !== otp || !user.otpVerified) {
        return res.status(401).json({ message: "Invalid or unverified OTP" });
      }

      if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return res.status(401).json({ message: "OTP has expired" });
      }

      // Reset password
      await storage.updateUserPassword(user.id, newPassword);
      
      // Clear OTP data
      await storage.clearUserOtp(user.id);

      res.json({ 
        success: true, 
        message: "Password reset successfully! You can now login with your new password." 
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category } = req.query;
      let products;

      if (category && typeof category === 'string') {
        products = await storage.getProductsByCategory(category);
      } else {
        products = await storage.getAllProducts();
      }

      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", authenticateToken, requireAdmin, upload.array('images', 5), async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);

      // Start product code generation immediately (most expensive operation)
      const productCodePromise = generateProductCode(productData.category, productData.subCategory);

      // Handle uploaded images in parallel with optimized file operations
      const imageUrlsPromise = (async () => {
        const imageUrls: string[] = [];
        if (req.files && Array.isArray(req.files)) {
          // Process images in parallel batches for better performance
          const imagePromises = req.files.map(async (file, index) => {
            const filename = `${Date.now()}-${index}-${file.originalname}`;
            const filepath = path.join(uploadsDir, filename);
            await fs.promises.rename(file.path, filepath);
            return `/uploads/${filename}`;
          });
          imageUrls.push(...await Promise.all(imagePromises));
        }
        return imageUrls;
      })();

      // Get gold rate for gold products only
      const goldRatePromise = productData.metalType === 'GOLD' ? Promise.resolve(5652) : Promise.resolve(null);

      // Wait for all essential operations
      const [productCode, imageUrls, goldRateAtCreation] = await Promise.all([
        productCodePromise,
        imageUrlsPromise, 
        goldRatePromise
      ]);

      // Create product immediately, defer barcode generation
      const product = await storage.createProduct({
        ...productData,
        images: imageUrls,
        productCode,
        goldRateAtCreation: goldRateAtCreation || undefined,
        barcode: productCode,
        barcodeImageUrl: '', // Will be generated asynchronously
        isActive: productData.isActive ?? true
      });

      // Generate barcode asynchronously (don't block response)
      setImmediate(async () => {
        try {
          const barcodeData: ProductBarcodeData = {
            productCode,
            productName: productData.name,
            purity: productData.purity || '22K',
            grossWeight: `${productData.grossWeight} g`,
            netWeight: `${productData.netWeight} g`,
            stones: productData.stones || 'None',
            goldRate: goldRateAtCreation ? `₹${goldRateAtCreation} / g` : 'N/A',
            approxPrice: `₹${productData.priceInr.toLocaleString('en-IN')} (excluding charges)`
          };

          const { imagePath } = await generateBarcode(JSON.stringify(barcodeData), productCode);
          await storage.updateProduct(product.id, { barcodeImageUrl: imagePath });
        } catch (error) {
          console.warn('Async barcode generation failed:', error);
        }
      });

      res.status(201).json(product);
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(400).json({ message: "Invalid product data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/products/:id", authenticateToken, requireAdmin, upload.array('images', 5), async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);

      // Handle uploaded images
      let updateData = { ...productData };
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const imageUrls: string[] = [];
        await Promise.all(req.files.map(async (file, index) => {
          const filename = `${Date.now()}-${index}-${file.originalname}`;
          const filepath = path.join(uploadsDir, filename);
          await fs.promises.rename(file.path, filepath);
          imageUrls.push(`/uploads/${filename}`);
        }));
        updateData.images = imageUrls;
      }

      const product = await storage.updateProduct(req.params.id, updateData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Update product price (Admin only)
  app.patch("/api/products/:id/price", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { priceInr, priceBhd, stock } = req.body;

      // Validate price inputs
      if (!priceInr || !priceBhd) {
        return res.status(400).json({ error: 'Both INR and BHD prices are required' });
      }

      const priceInrNum = parseFloat(priceInr);
      const priceBhdNum = parseFloat(priceBhd);

      if (isNaN(priceInrNum) || isNaN(priceBhdNum) || priceInrNum <= 0 || priceBhdNum <= 0) {
        return res.status(400).json({ error: 'Invalid price values' });
      }

      // Validate stock if provided
      let updateData: any = {
        priceInr: priceInrNum.toFixed(2),
        priceBhd: priceBhdNum.toFixed(3)
      };

      if (stock !== undefined) {
        const stockNum = parseInt(stock);
        if (isNaN(stockNum) || stockNum < 0) {
          return res.status(400).json({ error: 'Invalid stock value' });
        }
        updateData.stock = stockNum;
      }

      const updatedProduct = await storage.updateProduct(id, updateData);

      if (!updatedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product price:', error);
      res.status(500).json({ error: 'Failed to update product price and stock' });
    }
  });

  // Bill routes
  app.get("/api/bills", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { search, startDate, endDate } = req.query;
      let bills;

      if (search && typeof search === 'string') {
        bills = await storage.searchBills(search);
      } else if (startDate && endDate) {
        bills = await storage.getBillsByDateRange(new Date(startDate as string), new Date(endDate as string));
      } else {
        bills = await storage.getAllBills();
      }

      res.json(bills);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });

  app.get("/api/bills/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bill = await storage.getBill(req.params.id);
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }
      res.json(bill);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bill" });
    }
  });

  //app.post("/api/bills", authenticateToken, requireAdmin, async (req, res) => {
  // app.post("/api/bills", requireAdmin, async (req, res) => {
  //   try {
  //     const billData = insertBillSchema.parse(req.body);

  //     // Generate bill number
  //     const billCount = (await storage.getAllBills()).length;
  //     const billNumber = `INV-${String(billCount + 1).padStart(3, '0')}`;

  //     const bill = await storage.createBill({
  //       ...billData,
  //       billNumber
  //     });

  //     res.status(201).json(bill);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(400).json({ message: "Invalid bill data" });
  //   }
  // });

  app.post("/api/bills", async (req, res) => {
    try {
      const billData = insertBillSchema.parse(req.body);
      const billCount = (await storage.getAllBills()).length;
      const date = new Date();
      const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
      const billNumber = `PJ/${formattedDate}-${String(billCount + 1).padStart(3, '0')}`;

      const bill = await storage.createBill({
        ...billData,
        billNumber: billNumber
      } as any);

      res.status(201).json(bill);
    } catch (error: any) {
      console.error("Zod validation error:", error.errors || error);
      res.status(400).json({
        message: "Invalid bill data",
        details: error.errors || error.message
      });
    }
  });

  // Update existing bill
  app.put("/api/bills/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const billData = insertBillSchema.parse(req.body);

      // Get existing bill to preserve bill number
      const existingBill = await storage.getBillById(id);
      if (!existingBill) {
        return res.status(404).json({ message: "Bill not found" });
      }

      const updatedBill = await storage.updateBill(id, {
        ...billData,
        billNumber: existingBill.billNumber // Keep original bill number
      } as any);

      res.status(200).json(updatedBill);
    } catch (error: any) {
      console.error("Bill update error:", error.errors || error);
      res.status(400).json({
        message: "Failed to update bill",
        details: error.errors || error.message
      });
    }
  });

  // Send bill to WhatsApp
  app.post("/api/bills/:id/send-whatsapp", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const bill = await storage.getBill(req.params.id);
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }

      // Format the bill for WhatsApp message with PDF link
      const currencySymbol = bill.currency === 'INR' ? '₹' : 'BD';
      const pdfUrl = `${req.protocol}://${req.get('host')}/api/bills/${bill.id}/pdf`;
      
      const message = `*BILL GENERATED*

*Palaniappa Jewellers Since 2025*

━━━━━━━━━━━━━━━━━━━━━
*Bill Details*
━━━━━━━━━━━━━━━━━━━━━

Bill Number: *${bill.billNumber}*
Customer: *${bill.customerName}*
Email: ${bill.customerEmail}
Phone: ${bill.customerPhone}
Address: ${bill.customerAddress}

*Total Amount: ${currencySymbol} ${parseFloat(bill.total).toLocaleString()}*

*Items:*
${(typeof bill.items === 'string' ? JSON.parse(bill.items) : bill.items).map((item: any, index: number) => 
  `${index + 1}. ${item.productName} - ${currencySymbol}${parseFloat(item.price).toLocaleString()} × ${item.quantity}`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━
*Payment Summary*
━━━━━━━━━━━━━━━━━━━━━
Subtotal: ${currencySymbol}${parseFloat(bill.subtotal).toLocaleString()}
Making Charges: ${currencySymbol}${parseFloat(bill.makingCharges).toLocaleString()}
GST: ${currencySymbol}${parseFloat(bill.gst).toLocaleString()}
VAT: ${currencySymbol}${parseFloat(bill.vat).toLocaleString()}
*Total: ${currencySymbol}${parseFloat(bill.total).toLocaleString()}*

Thank you for choosing Palaniappa Jewellers!
Where every jewel is crafted for elegance that lasts generations.

Contact us: +919597201554
Premium quality, timeless beauty.`;

      // Create WhatsApp URL
      const phoneNumber = bill.customerPhone.replace(/[^\d]/g, '');
      const whatsappUrl = `https://wa.me/${phoneNumber.startsWith('91') ? phoneNumber : '91' + phoneNumber}?text=${encodeURIComponent(message)}`;

      // Log for production integration
      console.log(`[WhatsApp Bill] Sending bill ${bill.billNumber} to ${bill.customerName} (${bill.customerPhone})`);
      console.log(`[WhatsApp URL] ${whatsappUrl}`);
      console.log(`[PDF URL] ${pdfUrl}`);

      res.json({
        success: true,
        message: "Bill prepared for WhatsApp with PDF link",
        whatsappUrl: whatsappUrl,
        pdfUrl: pdfUrl,
        messagePreview: message
      });
    } catch (error) {
      console.error("Error preparing bill for WhatsApp:", error);
      res.status(500).json({ message: "Failed to prepare bill for WhatsApp" });
    }
  });



  // Professional Bill PDF generation - Exact replica of sample bill (public access for WhatsApp sharing)
  app.get("/api/bills/:id/pdf", async (req, res) => {
    try {
      const bill = await storage.getBill(req.params.id);
      if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
      }

      // Create PDF matching the sample bill format exactly
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 30,
        bufferPages: true,
        font: 'Helvetica',
        info: {
          Title: `Tax Invoice ${bill.billNumber}`,
          Author: 'Palaniappa Jewellers',
          Subject: 'Tax Invoice',
        }
      });
      
      const filename = `${bill.customerName.replace(/\s+/g, '_')}_${bill.billNumber.replace(/[\/\\]/g, '')}.pdf`;

      // Set headers for PDF download with better compatibility for WhatsApp
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`); // Changed to inline for better WhatsApp compatibility
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 30;
      let currentY = 50;

      // Add company logo (centered at top)
      try {
        const logoSize = 80;
        doc.image('./client/public/company-logo.jpg', 
                 (pageWidth - logoSize) / 2, currentY, { width: logoSize, height: logoSize });
        currentY += logoSize + 20;
      } catch (error) {
        // If no logo, add company name
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('PALANIAPPA JEWELLERS', 0, currentY, { align: 'center', width: pageWidth });
        doc.fontSize(12)
           .font('Helvetica')
           .text('Since 2025', 0, currentY + 20, { align: 'center', width: pageWidth });
        currentY += 45;
      }

      // Customer copy header (top right)
      doc.fontSize(10)
         .font('Helvetica')
         .text('CUSTOMER COPY', pageWidth - 120, 50)
         .text(`Date: ${new Date(bill.createdAt!).toLocaleDateString('en-IN')} ${new Date(bill.createdAt!).toLocaleTimeString('en-IN')}`, pageWidth - 140, 65);

      currentY += 20;

      // TAX INVOICE header with border - matching preview style
      const headerY = currentY;
      doc.rect(margin, headerY, pageWidth - (margin * 2), 30)
         .fill('#F5F5F5')
         .stroke('#000000')
         .lineWidth(1);

      doc.fontSize(16)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('TAX INVOICE', margin + 8, headerY + 8);

      currentY += 40;

      // Company and Customer details section with border - matching preview
      const detailsY = currentY;
      const detailsHeight = 140;
      const leftColumnWidth = (pageWidth - margin * 2) / 2 - 10;
      
      // Draw border around details section
      doc.rect(margin, detailsY, pageWidth - (margin * 2), detailsHeight)
         .stroke('#000000')
         .lineWidth(1);
      
      // Left side - Company details
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('PALANIAPPA JEWELLERS', margin + 8, detailsY + 10);
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#000000')
         .text('Premium Jewelry Store', margin + 8, detailsY + 25)
         .text('123 Jewelry Street', margin + 8, detailsY + 38)
         .text('Chennai, Tamil Nadu', margin + 8, detailsY + 51)
         .text('PINCODE: 600001', margin + 8, detailsY + 64)
         .text('Phone Number: +919597201554', margin + 8, detailsY + 77)
         .text('GSTIN: 33AAACT5712A124', margin + 8, detailsY + 90)
         .text('Email: jewelerypalaniappa@gmail.com', margin + 8, detailsY + 103);

      // Right side - Customer details
      const rightX = margin + leftColumnWidth + 20;
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('CUSTOMER DETAILS:', rightX, detailsY + 10);
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#000000')
         .text(`${bill.customerName || 'N/A'}`, rightX, detailsY + 25)
         .text(`${bill.customerPhone || 'N/A'}`, rightX, detailsY + 38)
         .text(`${bill.customerEmail || 'N/A'}`, rightX, detailsY + 51)
         .text(`${bill.customerAddress || 'N/A'}`, rightX, detailsY + 64, { width: leftColumnWidth - 10 });

      currentY = detailsY + detailsHeight + 20;

      // Removed standard rates section as requested by user

      // Items table matching preview layout exactly
      const tableY = currentY;
      const vatHeader = bill.currency === 'INR' ? 'GST (3%)' : 'VAT\n(5%)';
      const tableHeaders = ['Product\nDescription', 'Qty', 'Gross\nWeight(gms)', 'Net\nWeight(gms)', 'Product\nPrice', 'Making\nCharges', 'Discount', vatHeader, 'Value'];
      const colWidths = [80, 30, 60, 60, 60, 60, 60, 50, 60];
      
      // Table header with gray background like preview
      doc.rect(margin, tableY, pageWidth - (margin * 2), 35)
         .fill('#E5E5E5')
         .stroke('#000000');

      let headerX = margin + 2;
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#000000');
      
      tableHeaders.forEach((header, i) => {
        doc.text(header, headerX, tableY + 8, { width: colWidths[i] - 2, align: 'center' });
        headerX += colWidths[i];
      });

      currentY = tableY + 35;

      // Table rows
      doc.fontSize(7)
         .font('Helvetica');

      const currency = bill.currency === 'INR' ? 'Rs.' : 'BD';
      
      bill.items.forEach((item, index) => {
        const rowY = currentY;
        const rowHeight = 25;
        
        // Row background
        if (index % 2 === 1) {
          doc.rect(margin, rowY, pageWidth - (margin * 2), rowHeight)
             .fill('#F8F8F8');
        }
        
        // Row border
        doc.rect(margin, rowY, pageWidth - (margin * 2), rowHeight)
           .stroke('#000000');

        let cellX = margin + 3;
        doc.fillColor('#000000');
        
        // Product Description
        doc.text(item.productName, cellX, rowY + 8, { width: colWidths[0] - 2 });
        cellX += colWidths[0];
        
        // Purity
        doc.text('22K', cellX, rowY + 8, { width: colWidths[1] - 2, align: 'center' });
        cellX += colWidths[1];
        
        // Net Weight
        const netWeight = parseFloat(item.netWeight) || 5.0;
        doc.text(netWeight.toFixed(3), cellX, rowY + 8, { width: colWidths[2] - 2, align: 'center' });
        cellX += colWidths[2];
        
        // Gross Weight
        const grossWeight = parseFloat(item.grossWeight) || netWeight + 0.5;
        doc.text(grossWeight.toFixed(3), cellX, rowY + 8, { width: colWidths[3] - 2, align: 'center' });
        cellX += colWidths[3];
        
        // Product Price
        const rate = bill.currency === 'INR' ? parseFloat(item.priceInr) : parseFloat(item.priceBhd);
        doc.text(`${currency} ${rate.toFixed(2)}`, cellX, rowY + 8, { width: colWidths[4] - 2, align: 'right' });
        cellX += colWidths[4];
        
        // Making Charges
        const makingCharges = parseFloat(item.makingCharges) || 0;
        doc.text(`${currency} ${makingCharges.toFixed(2)}`, cellX, rowY + 8, { width: colWidths[5] - 2, align: 'right' });
        cellX += colWidths[5];
        
        // Discount
        const discount = parseFloat(item.discount) || 0;
        doc.text(`${currency} ${discount.toFixed(2)}`, cellX, rowY + 8, { width: colWidths[6] - 2, align: 'right' });
        cellX += colWidths[6];
        
        // Tax (GST for India, VAT for Bahrain)
        const tax = bill.currency === 'INR' ? parseFloat(item.sgst) + parseFloat(item.cgst) : parseFloat(item.vat);
        const taxLabel = bill.currency === 'INR' ? 'GST' : 'VAT';
        const taxPercentage = bill.currency === 'INR' ? '3' : '10';
        doc.text(`${taxLabel} (${taxPercentage}%)`, cellX, rowY + 8, { width: colWidths[7] - 2, align: 'center' });
        cellX += colWidths[7];
        
        // Total Amount
        doc.text(`${currency} ${parseFloat(item.total).toFixed(2)}`, cellX, rowY + 8, { width: colWidths[8] - 2, align: 'right' });

        currentY += rowHeight;
      });

      // Total row
      const totalRowY = currentY;
      doc.rect(margin, totalRowY, pageWidth - (margin * 2), 20)
         .fill('#E5E5E5')
         .stroke('#000000');

      doc.fontSize(8)
         .font('Helvetica-Bold')
         .text('Total', margin + 5, totalRowY + 8)
         .text(bill.items.length.toString(), margin + 120, totalRowY + 8, { align: 'center' })
         .text(parseFloat(bill.total).toFixed(2), pageWidth - 80, totalRowY + 8, { align: 'right' });

      currentY = totalRowY + 30;

      // Payment Details and Bill Summary - Two column layout like preview
      const summaryY = currentY + 10;
      const leftBoxWidth = (pageWidth - (margin * 2)) / 2 - 10;
      const rightBoxWidth = leftBoxWidth;
      const boxHeight = 100;
      
      // Left box - Payment Details
      doc.rect(margin, summaryY, leftBoxWidth, boxHeight)
         .stroke('#000000');
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('Payment Details', margin + 5, summaryY + 5);
      
      // Payment details table
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .text('Payment Mode', margin + 5, summaryY + 25)
         .text('Amount (BHD)', margin + 120, summaryY + 25);
      
      doc.font('Helvetica')
         .text(bill.paymentMethod || 'CASH', margin + 5, summaryY + 40)
         .text(`${currency}${parseFloat(bill.paidAmount).toFixed(2)}`, margin + 120, summaryY + 40);
      
      doc.font('Helvetica-Bold')
         .text('Total Amount Paid', margin + 5, summaryY + 60)
         .text(`${currency}${parseFloat(bill.paidAmount).toFixed(2)}`, margin + 120, summaryY + 60);
      
      // Right box - Bill Summary
      const rightBoxX = margin + leftBoxWidth + 20;
      doc.rect(rightBoxX, summaryY, rightBoxWidth, boxHeight)
         .stroke('#000000');
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Bill Summary', rightBoxX + 5, summaryY + 5);
      
      // Bill summary details
      const subtotal = parseFloat(bill.subtotal);
      const makingCharges = parseFloat(bill.makingCharges);
      const discount = parseFloat(bill.discount) || 0;
      const gst = parseFloat(bill.gst) || 0;
      const vat = parseFloat(bill.vat) || 0;
      const taxAmount = bill.currency === 'INR' ? gst : vat;
      
      doc.fontSize(8)
         .font('Helvetica')
         .text('Subtotal:', rightBoxX + 5, summaryY + 25)
         .text(`${currency}${subtotal.toFixed(2)}`, rightBoxX + rightBoxWidth - 60, summaryY + 25, { align: 'right' })
         .text('Making Charges:', rightBoxX + 5, summaryY + 38)
         .text(`${currency}${makingCharges.toFixed(2)}`, rightBoxX + rightBoxWidth - 60, summaryY + 38, { align: 'right' })
         .text(bill.currency === 'BHD' ? 'VAT:' : 'GST:', rightBoxX + 5, summaryY + 51)
         .text(`${currency}${taxAmount.toFixed(2)}`, rightBoxX + rightBoxWidth - 60, summaryY + 51, { align: 'right' })
         .text('Discount:', rightBoxX + 5, summaryY + 64)
         .text(`${currency}${discount.toFixed(2)}`, rightBoxX + rightBoxWidth - 60, summaryY + 64, { align: 'right' });
      
      doc.font('Helvetica-Bold')
         .text('Total Amount:', rightBoxX + 5, summaryY + 77)
         .text(`${currency}${parseFloat(bill.total).toFixed(2)}`, rightBoxX + rightBoxWidth - 60, summaryY + 77, { align: 'right' });

      currentY = summaryY + boxHeight + 10;

      // Amount in words section - matching preview
      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text('Amount in Words:', margin + 5, currentY + 10);
      
      const total = parseFloat(bill.total);
      const amountInWords = bill.currency === 'INR' 
        ? `Rupees ${Math.floor(total)} and ${Math.round((total - Math.floor(total)) * 100)} Paise Only`
        : `Bahrain Dinars ${Math.floor(total)} and ${Math.round((total - Math.floor(total)) * 1000)} Fils Only`;
      
      doc.font('Helvetica')
         .text(amountInWords, margin + 90, currentY + 10);

      currentY += 40;

      // Final total amount section - exactly matching preview style
      const totalSectionY = currentY;
      const totalBoxWidth = pageWidth - (margin * 2);
      const totalBoxHeight = 30;
      
      // Black background box with yellow text - matching preview
      doc.rect(margin, totalSectionY, totalBoxWidth, totalBoxHeight)
         .fill('#000000')
         .stroke('#000000');

      // Left side - "TOTAL AMOUNT TO BE PAID:"
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#FFD700')
         .text('TOTAL AMOUNT TO BE PAID:', margin + 10, totalSectionY + 8);
      
      // Right side - Amount with proper alignment
      const amountText = `${currency} ${parseFloat(bill.total).toFixed(2)}`;
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#FFD700')
         .text(amountText, margin + totalBoxWidth - 150, totalSectionY + 8, { 
           align: 'right',
           width: 140
         });

      currentY = totalSectionY + totalBoxHeight + 20;

      currentY += 20;

      // Footer text - matching preview exactly
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#666666')
         .text('This is a computer-generated bill.No signature required', 0, currentY, { 
           align: 'center', 
           width: pageWidth 
         })
         .text('Thank you for shopping with Palaniappa Jewellery!', 0, currentY + 15, { 
           align: 'center', 
           width: pageWidth 
         });

      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = 'inr', items } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is not available" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * (currency === 'bhd' ? 1000 : 100)), // Convert to minor units
        currency: currency.toLowerCase(),
        metadata: {
          integration_check: 'accept_a_payment',
          items: JSON.stringify(items || [])
        },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Stripe payment intent error:', error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Orders routes (for e-commerce checkout)
  app.post("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orderData = req.body;
      
      // Generate order number
      const orderCount = (await storage.getAllBills()).length; // Reuse bill count for now
      const date = new Date();
      const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
      const orderNumber = `ORD/${formattedDate}-${String(orderCount + 1).padStart(3, '0')}`;

      // For now, create as a bill since we haven't migrated the schema yet
      const bill = await storage.createBill({
        billNumber: orderNumber,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        currency: orderData.currency || 'INR',
        subtotal: orderData.subtotal.toString(),
        makingCharges: (orderData.makingCharges || 0).toString(),
        gst: (orderData.gst || 0).toString(),
        vat: (orderData.vat || 0).toString(),
        discount: (orderData.discount || 0).toString(),
        total: orderData.total.toString(),
        paidAmount: orderData.paidAmount.toString(),
        paymentMethod: orderData.paymentMethod || 'CASH',
        items: orderData.items || [],
      });

      // Create a shipment record for order tracking
      try {
        const shipmentData = {
          orderId: bill.id,
          carrier: "Blue Dart Express", // Default carrier
          shippingMethodId: "standard-delivery", // Will need to update this later
          senderAddress: "Salem Main Store, Tamil Nadu",
          senderCity: "Salem",
          senderState: "Tamil Nadu",
          senderCountry: "India",
          senderPostalCode: "636001",
          senderPhone: "+919597201554",
          recipientName: orderData.customerName,
          recipientAddress: orderData.customerAddress,
          recipientCity: "Unknown", // We'll improve this later with better address parsing
          recipientState: "Unknown",
          recipientCountry: "India",
          recipientPostalCode: "000000",
          recipientPhone: orderData.customerPhone,
          recipientEmail: orderData.customerEmail,
          packageWeight: "0.1", // Default 100g for jewelry
          packageValue: orderData.total.toString(),
          packageCurrency: orderData.currency || "INR",
          itemsDescription: orderData.items?.map((item: any) => item.productName).join(", ") || "Jewelry Items",
          shippingCost: "0", // Free shipping for now
          insuranceCost: "0",
          totalCost: "0",
          status: "CREATED",
          estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        };

        await storage.createShipment(shipmentData);
      } catch (shipmentError) {
        console.error("Failed to create shipment for order:", shipmentError);
        // Don't fail the order creation if shipment creation fails
      }

      res.status(201).json({
        orderNumber: bill.billNumber,
        ...bill
      });
    } catch (error: any) {
      console.error("Order creation error:", error);
      res.status(400).json({
        message: "Failed to create order",
        details: error.message
      });
    }
  });

  // Get all orders (for admin dashboard)
  app.get("/api/orders", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // For now, get bills as orders since they're being used for order storage
      const bills = await storage.getAllBills();
      
      // Transform bills to order format for frontend
      const orders = bills.map(bill => ({
        id: bill.id,
        orderNumber: bill.billNumber,
        customerName: bill.customerName,
        customerEmail: bill.customerEmail,
        customerPhone: bill.customerPhone,
        customerAddress: bill.customerAddress,
        currency: bill.currency,
        subtotal: bill.subtotal,
        makingCharges: bill.makingCharges,
        gst: bill.gst,
        vat: bill.vat,
        discount: bill.discount,
        total: bill.total,
        paidAmount: bill.paidAmount,
        paymentMethod: bill.paymentMethod,
        paymentStatus: "PAID", // Default since these are completed orders
        orderStatus: "CONFIRMED", // Default status
        items: bill.items,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt
      }));

      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Metal rates API routes
  app.get("/api/metal-rates", async (req, res) => {
    try {
      const { market } = req.query;
      const rates = await MetalRatesService.getLatestRates(
        market as "INDIA" | "BAHRAIN" | undefined
      );
      
      res.json(rates);
    } catch (error: any) {
      console.error("Error fetching metal rates:", error);
      res.status(500).json({ 
        message: "Failed to fetch metal rates",
        error: error.message 
      });
    }
  });

  // Force update metal rates (admin only)
  app.post("/api/metal-rates/update", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await MetalRatesService.fetchLiveRates();
      const rates = await MetalRatesService.getLatestRates();
      
      res.json({ 
        message: "Metal rates updated successfully", 
        rates 
      });
    } catch (error: any) {
      console.error("Error updating metal rates:", error);
      res.status(500).json({ 
        message: "Failed to update metal rates",
        error: error.message 
      });
    }
  });

  // Estimates routes
  app.get('/api/estimates', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const estimatesList = await storage.getAllEstimates();
      res.json(estimatesList);
    } catch (error) {
      console.error('Error fetching estimates:', error);
      res.status(500).json({ error: 'Failed to fetch estimates' });
    }
  });

  app.post('/api/estimates', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const estimate = await storage.createEstimate(req.body);
      res.status(201).json(estimate);
    } catch (error) {
      console.error('Error creating estimate:', error);
      res.status(500).json({ error: 'Failed to create estimate' });
    }
  });

  app.get('/api/estimates/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const estimateId = req.params.id;
      const estimate = await storage.getEstimate(estimateId);
      
      if (!estimate) {
        return res.status(404).json({ error: 'Estimate not found' });
      }

      res.json(estimate);
    } catch (error) {
      console.error('Error fetching estimate:', error);
      res.status(500).json({ error: 'Failed to fetch estimate' });
    }
  });

  app.put('/api/estimates/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const estimateId = req.params.id;
      const estimate = await storage.updateEstimate(estimateId, req.body);
      res.json(estimate);
    } catch (error) {
      console.error('Error updating estimate:', error);
      res.status(500).json({ error: 'Failed to update estimate' });
    }
  });

  // Send estimate to WhatsApp
  app.post('/api/estimates/:id/send-whatsapp', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const estimateId = req.params.id;
      const estimate = await storage.getEstimate(estimateId);
      
      if (!estimate) {
        return res.status(404).json({ error: 'Estimate not found' });
      }
      
      // Create detailed WhatsApp message (fallback approach)
      const formatCurrency = (value: string | number): string => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return `₹${num.toLocaleString('en-IN')}`;
      };

      const formattedDate = estimate.createdAt ? new Date(estimate.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
      const validUntilDate = estimate.validUntil ? new Date(estimate.validUntil).toLocaleDateString('en-GB') : 'N/A';
      const gstAmount = Math.round((parseFloat(estimate.subtotal) * 3) / 100);

      const message = `🏺 *PALANIAPPA JEWELLERS*
*JEWELLERY QUOTATION*

══════════════════════════════

*Quotation No:* ${estimate.quotationNo}
*Date:* ${formattedDate}
*Customer:* ${estimate.customerName}

─────────────────────────────
*PRODUCT DETAILS*
─────────────────────────────
*Product Name:* ${estimate.productName}
*Category:* ${estimate.category}
*Purity:* ${estimate.purity}
*Gross Weight:* ${estimate.grossWeight} g
*Net Weight:* ${estimate.netWeight} g
*Product Code:* ${estimate.productCode || '-'}

─────────────────────────────
*PRICE ESTIMATION*
─────────────────────────────
*Metal Value:* ${formatCurrency(estimate.metalValue)}
*Making Charges (${estimate.makingChargesPercentage}%):* ${formatCurrency(estimate.makingCharges)}
*Stone/Diamond Charges:* ${formatCurrency(estimate.stoneDiamondCharges || '0')}
*Wastage (${estimate.wastagePercentage}%):* ${formatCurrency(estimate.wastageCharges)}
*Hallmarking:* ${formatCurrency(estimate.hallmarkingCharges || '450')}
─────────────────────────────
*Subtotal:* ${formatCurrency(estimate.subtotal)}

*GST (3%):* ₹${gstAmount.toLocaleString('en-IN')}
*VAT (0%):* ₹0

*🟡 TOTAL AMOUNT: ${formatCurrency(estimate.totalAmount)}*

*Valid Until:* ${validUntilDate}

Thank you for choosing Palaniappa Jewellers! 🙏

For any queries, please contact us.`;

      const whatsappUrl = `https://wa.me/${estimate.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      
      // Mark as sent to WhatsApp
      await storage.updateEstimate(estimateId, { sentToWhatsApp: true });

      res.json({ whatsappUrl, message });
    } catch (error) {
      console.error('Error sending to WhatsApp:', error);
      res.status(500).json({ error: 'Failed to send to WhatsApp' });
    }
  });

  // === CATEGORY MANAGEMENT ROUTES ===

  // Get all categories with hierarchy
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategoriesHierarchy();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Get main categories only
  app.get("/api/categories/main", async (req, res) => {
    try {
      const categories = await storage.getMainCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching main categories:', error);
      res.status(500).json({ error: 'Failed to fetch main categories' });
    }
  });

  // Get subcategories for a parent category
  app.get("/api/categories/:parentId/subcategories", async (req, res) => {
    try {
      const { parentId } = req.params;
      const subcategories = await storage.getSubCategories(parentId);
      res.json(subcategories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      res.status(500).json({ error: 'Failed to fetch subcategories' });
    }
  });

  // Get single category by ID
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  });

  // Create new category (Admin only)
  app.post("/api/categories", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid category data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create category' });
    }
  });

  // Update category (Admin only)
  app.put("/api/categories/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = updateCategorySchema.parse({ ...req.body, id });
      const category = await storage.updateCategory(id, updateData);
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid category data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update category' });
    }
  });

  // Delete category (Admin only)
  app.delete("/api/categories/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(400).json({ 
          error: 'Cannot delete category. It may have subcategories or be used by products.' 
        });
      }
      
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  });

  // Reorder categories (Admin only)
  app.post("/api/categories/reorder", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { categoryIds } = req.body;
      
      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({ error: 'categoryIds must be an array' });
      }
      
      const success = await storage.reorderCategories(categoryIds);
      
      if (!success) {
        return res.status(400).json({ error: 'Failed to reorder categories' });
      }
      
      res.json({ message: 'Categories reordered successfully' });
    } catch (error) {
      console.error('Error reordering categories:', error);
      res.status(500).json({ error: 'Failed to reorder categories' });
    }
  });

  // Seed initial categories (Admin only - for setup)
  app.post("/api/categories/seed", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Check if categories already exist
      const existingCategories = await storage.getAllCategories();
      if (existingCategories.length > 0) {
        return res.status(400).json({ error: 'Categories already exist' });
      }

      // Define initial categories matching the admin product form
      const initialCategories = [
        { name: 'Rings', slug: 'rings', displayOrder: 0 },
        { name: 'Necklaces', slug: 'necklaces', displayOrder: 1 },
        { name: 'Pendants', slug: 'pendants', displayOrder: 2 },
        { name: 'Earrings', slug: 'earrings', displayOrder: 3 },
        { name: 'Bracelets', slug: 'bracelets', displayOrder: 4 },
        { name: 'Bangles', slug: 'bangles', displayOrder: 5 },
        { name: 'Watches', slug: 'watches', displayOrder: 6 },
        { name: "Men's Jewellery", slug: 'mens-jewellery', displayOrder: 7 },
        { name: "Children's Jewellery", slug: 'childrens-jewellery', displayOrder: 8 },
        { name: 'Materials', slug: 'materials', displayOrder: 9 },
        { name: 'Collections', slug: 'collections', displayOrder: 10 },
        { name: 'Custom Jewellery', slug: 'custom-jewellery', displayOrder: 11 },
        { name: 'New Arrivals', slug: 'new-arrivals', displayOrder: 12 },
        { name: 'Gold Coins', slug: 'gold-coins', displayOrder: 13 }
      ];

      // Create main categories first
      const createdCategories = new Map<string, any>();
      for (const category of initialCategories) {
        const created = await storage.createCategory({
          ...category,
          isActive: true
        });
        createdCategories.set(category.slug, created);
      }

      // Define subcategories
      const subcategories = [
        // Rings subcategories
        { name: 'Engagement Rings', slug: 'engagement-rings', parentSlug: 'rings' },
        { name: 'Wedding Bands', slug: 'wedding-bands', parentSlug: 'rings' },
        { name: 'Fashion Rings', slug: 'fashion-rings', parentSlug: 'rings' },
        { name: 'Cocktail Rings', slug: 'cocktail-rings', parentSlug: 'rings' },
        { name: 'Promise Rings', slug: 'promise-rings', parentSlug: 'rings' },
        { name: 'Birthstone Rings', slug: 'birthstone-rings', parentSlug: 'rings' },

        // Necklaces subcategories
        { name: 'Chains', slug: 'chains', parentSlug: 'necklaces' },
        { name: 'Chokers', slug: 'chokers', parentSlug: 'necklaces' },
        { name: 'Lockets', slug: 'lockets', parentSlug: 'necklaces' },
        { name: 'Beaded Necklaces', slug: 'beaded-necklaces', parentSlug: 'necklaces' },
        { name: 'Collars', slug: 'collars', parentSlug: 'necklaces' },
        { name: 'Long Necklaces/Opera Chains', slug: 'long-necklaces-opera-chains', parentSlug: 'necklaces' },

        // Materials subcategories
        { name: 'Gold Jewellery', slug: 'gold-jewellery', parentSlug: 'materials' },
        { name: 'Silver Jewellery', slug: 'silver-jewellery', parentSlug: 'materials' },
        { name: 'Platinum Jewellery', slug: 'platinum-jewellery', parentSlug: 'materials' },
        { name: 'Diamond Jewellery', slug: 'diamond-jewellery', parentSlug: 'materials' },
        { name: 'Gemstone Jewellery', slug: 'gemstone-jewellery', parentSlug: 'materials' },
        { name: 'Pearl Jewellery', slug: 'pearl-jewellery', parentSlug: 'materials' },
      ];

      // Create subcategories
      let createdSubcategories = 0;
      for (const subcategory of subcategories) {
        const parentCategory = createdCategories.get(subcategory.parentSlug);
        if (parentCategory) {
          await storage.createCategory({
            name: subcategory.name,
            slug: subcategory.slug,
            parentId: parentCategory.id,
            isActive: true,
            displayOrder: createdSubcategories
          });
          createdSubcategories++;
        }
      }

      res.json({ 
        message: 'Initial categories created successfully',
        mainCategories: initialCategories.length,
        subcategories: createdSubcategories
      });
    } catch (error) {
      console.error('Error seeding categories:', error);
      res.status(500).json({ error: 'Failed to seed categories' });
    }
  });

  // === END CATEGORY MANAGEMENT ROUTES ===

  // ==============================
  // HOME SECTIONS MANAGEMENT API
  // ==============================

  // Get all home sections with items (admin gets all, public gets only active)
  app.get("/api/home-sections", authenticateToken, async (req, res) => {
    try {
      // Check if user is admin - if so, show all sections (active and inactive)
      // If not admin or not authenticated, show only active sections
      const isAdmin = (req as any).user?.role === 'admin';
      const sections = isAdmin 
        ? await storage.getAllHomeSectionsForAdmin()
        : await storage.getAllHomeSections();
      res.json(sections);
    } catch (error) {
      console.error('Error fetching home sections:', error);
      res.status(500).json({ error: 'Failed to fetch home sections' });
    }
  });

  // Get all active home sections for public (no auth required)
  app.get("/api/home-sections/public", async (req, res) => {
    try {
      const sections = await storage.getAllHomeSections();
      res.json(sections);
    } catch (error) {
      console.error('Error fetching home sections:', error);
      res.status(500).json({ error: 'Failed to fetch home sections' });
    }
  });

  // Get single home section with items
  app.get("/api/home-sections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const section = await storage.getHomeSection(id);
      if (!section) {
        return res.status(404).json({ error: 'Home section not found' });
      }
      res.json(section);
    } catch (error) {
      console.error('Error fetching home section:', error);
      res.status(500).json({ error: 'Failed to fetch home section' });
    }
  });

  // Create new home section (Admin only)
  app.post("/api/home-sections", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const sectionData = insertHomeSectionSchema.parse(req.body);
      const section = await storage.createHomeSection(sectionData);
      res.status(201).json(section);
    } catch (error) {
      console.error('Error creating home section:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid home section data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create home section' });
    }
  });

  // Update home section (Admin only)
  app.put("/api/home-sections/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const section = await storage.updateHomeSection(id, updateData);
      if (!section) {
        return res.status(404).json({ error: 'Home section not found' });
      }
      res.json(section);
    } catch (error) {
      console.error('Error updating home section:', error);
      res.status(500).json({ error: 'Failed to update home section' });
    }
  });

  // Delete home section (Admin only)
  app.delete("/api/home-sections/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteHomeSection(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Home section not found' });
      }
      res.json({ message: 'Home section deleted successfully' });
    } catch (error) {
      console.error('Error deleting home section:', error);
      res.status(500).json({ error: 'Failed to delete home section' });
    }
  });

  // Get items for a specific home section
  app.get("/api/home-sections/:id/items", async (req, res) => {
    try {
      const { id } = req.params;
      const items = await storage.getHomeSectionItems(id);
      res.json(items);
    } catch (error) {
      console.error('Error fetching home section items:', error);
      res.status(500).json({ error: 'Failed to fetch home section items' });
    }
  });

  // Add item to home section (Admin only)
  app.post("/api/home-sections/:id/items", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const itemData = insertHomeSectionItemSchema.parse({
        ...req.body,
        sectionId: id
      });
      const item = await storage.addHomeSectionItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error adding home section item:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid home section item data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to add home section item' });
    }
  });

  // Update home section item (Admin only)
  app.put("/api/home-sections/:id/items/:itemId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { itemId } = req.params;
      const updateData = req.body;
      const item = await storage.updateHomeSectionItem(itemId, updateData);
      if (!item) {
        return res.status(404).json({ error: 'Home section item not found' });
      }
      res.json(item);
    } catch (error) {
      console.error('Error updating home section item:', error);
      res.status(500).json({ error: 'Failed to update home section item' });
    }
  });

  // Remove item from home section (Admin only)
  app.delete("/api/home-sections/:id/items/:itemId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { itemId } = req.params;
      const deleted = await storage.deleteHomeSectionItem(itemId);
      if (!deleted) {
        return res.status(404).json({ error: 'Home section item not found' });
      }
      res.json({ message: 'Home section item removed successfully' });
    } catch (error) {
      console.error('Error removing home section item:', error);
      res.status(500).json({ error: 'Failed to remove home section item' });
    }
  });

  // Reorder home sections (Admin only)
  app.post("/api/home-sections/reorder", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { sectionOrders } = req.body; // Array of { id, displayOrder }
      
      if (!Array.isArray(sectionOrders)) {
        return res.status(400).json({ error: 'sectionOrders must be an array' });
      }

      for (const { id, displayOrder } of sectionOrders) {
        await storage.updateHomeSection(id, { displayOrder });
      }
      
      res.json({ message: 'Home sections reordered successfully' });
    } catch (error) {
      console.error('Error reordering home sections:', error);
      res.status(500).json({ error: 'Failed to reorder home sections' });
    }
  });

  // === END HOME SECTIONS MANAGEMENT ROUTES ===

  // === SHIPPING & LOGISTICS API ROUTES ===

  // Shipping Zones
  app.get("/api/shipping/zones", async (req, res) => {
    try {
      const zones = await storage.getAllShippingZones();
      res.json(zones);
    } catch (error) {
      console.error('Error fetching shipping zones:', error);
      res.status(500).json({ error: 'Failed to fetch shipping zones' });
    }
  });

  app.post("/api/shipping/zones", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertShippingZoneSchema.parse(req.body);
      const zone = await storage.createShippingZone(validatedData);
      res.status(201).json(zone);
    } catch (error) {
      console.error('Error creating shipping zone:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create shipping zone' });
    }
  });

  app.put("/api/shipping/zones/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertShippingZoneSchema.partial().parse(req.body);
      const zone = await storage.updateShippingZone(id, validatedData);
      if (!zone) {
        return res.status(404).json({ error: 'Shipping zone not found' });
      }
      res.json(zone);
    } catch (error) {
      console.error('Error updating shipping zone:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update shipping zone' });
    }
  });

  app.delete("/api/shipping/zones/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteShippingZone(id);
      if (!success) {
        return res.status(404).json({ error: 'Shipping zone not found' });
      }
      res.json({ message: 'Shipping zone deleted successfully' });
    } catch (error) {
      console.error('Error deleting shipping zone:', error);
      res.status(500).json({ error: 'Failed to delete shipping zone' });
    }
  });

  // Shipping Methods
  app.get("/api/shipping/methods", async (req, res) => {
    try {
      const { zoneId, country } = req.query;
      
      let methods;
      if (zoneId) {
        methods = await storage.getShippingMethodsByZone(zoneId as string);
      } else if (country) {
        methods = await storage.getShippingMethodsByCountry(country as string);
      } else {
        methods = await storage.getAllShippingMethods();
      }
      
      res.json(methods);
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      res.status(500).json({ error: 'Failed to fetch shipping methods' });
    }
  });

  app.post("/api/shipping/methods", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertShippingMethodSchema.parse(req.body);
      const method = await storage.createShippingMethod(validatedData);
      res.status(201).json(method);
    } catch (error) {
      console.error('Error creating shipping method:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create shipping method' });
    }
  });

  app.put("/api/shipping/methods/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertShippingMethodSchema.partial().parse(req.body);
      const method = await storage.updateShippingMethod(id, validatedData);
      if (!method) {
        return res.status(404).json({ error: 'Shipping method not found' });
      }
      res.json(method);
    } catch (error) {
      console.error('Error updating shipping method:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update shipping method' });
    }
  });

  app.delete("/api/shipping/methods/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteShippingMethod(id);
      if (!success) {
        return res.status(404).json({ error: 'Shipping method not found' });
      }
      res.json({ message: 'Shipping method deleted successfully' });
    } catch (error) {
      console.error('Error deleting shipping method:', error);
      res.status(500).json({ error: 'Failed to delete shipping method' });
    }
  });

  // Shipping Cost Calculation
  app.post("/api/shipping/calculate", async (req, res) => {
    try {
      const validatedData = calculateShippingSchema.parse(req.body);
      const { recipientCountry, packageWeight, packageValue, currency } = validatedData;
      
      const result = await storage.calculateShippingCost(recipientCountry, packageWeight, packageValue, currency);
      res.json(result);
    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to calculate shipping cost' });
    }
  });

  // Shipments
  app.get("/api/shipments", authenticateToken, async (req, res) => {
    try {
      const { orderId, trackingNumber } = req.query;
      
      let shipments;
      if (orderId) {
        shipments = await storage.getShipmentsByOrder(orderId as string);
      } else if (trackingNumber) {
        const shipment = await storage.getShipmentByTrackingNumber(trackingNumber as string);
        shipments = shipment ? [shipment] : [];
      } else {
        shipments = await storage.getAllShipments();
      }
      
      res.json(shipments);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      res.status(500).json({ error: 'Failed to fetch shipments' });
    }
  });

  app.get("/api/shipments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const shipment = await storage.getShipment(id);
      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }
      res.json(shipment);
    } catch (error) {
      console.error('Error fetching shipment:', error);
      res.status(500).json({ error: 'Failed to fetch shipment' });
    }
  });

  app.post("/api/shipments", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertShipmentSchema.parse(req.body);
      const shipment = await storage.createShipment(validatedData);
      res.status(201).json(shipment);
    } catch (error) {
      console.error('Error creating shipment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create shipment' });
    }
  });

  app.put("/api/shipments/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateShipmentStatusSchema.parse(req.body);
      const { status, trackingEvents, estimatedDeliveryDate, actualDeliveryDate, notes } = validatedData;
      
      let shipment = await storage.updateShipmentStatus(id, status, trackingEvents);
      
      if (estimatedDeliveryDate || actualDeliveryDate || notes) {
        const updateData: any = {};
        if (estimatedDeliveryDate) updateData.estimatedDeliveryDate = estimatedDeliveryDate;
        if (actualDeliveryDate) updateData.actualDeliveryDate = actualDeliveryDate;
        if (notes) updateData.notes = notes;
        
        shipment = await storage.updateShipment(id, updateData);
      }
      
      if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
      }
      res.json(shipment);
    } catch (error) {
      console.error('Error updating shipment status:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update shipment status' });
    }
  });

  // Public tracking endpoint (no authentication required)
  app.get("/api/track/:trackingNumber", async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      const shipment = await storage.getShipmentByTrackingNumber(trackingNumber);
      
      if (!shipment) {
        return res.status(404).json({ error: 'Tracking number not found' });
      }
      
      // Return limited tracking information for public access
      const publicTrackingInfo = {
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        carrier: shipment.carrier,
        estimatedDeliveryDate: shipment.estimatedDeliveryDate,
        actualDeliveryDate: shipment.actualDeliveryDate,
        trackingEvents: shipment.trackingEvents,
        lastTrackingUpdate: shipment.lastTrackingUpdate,
        recipientCity: shipment.recipientCity,
        recipientState: shipment.recipientState,
        recipientCountry: shipment.recipientCountry,
      };
      
      res.json(publicTrackingInfo);
    } catch (error) {
      console.error('Error tracking shipment:', error);
      res.status(500).json({ error: 'Failed to track shipment' });
    }
  });

  // Delivery Attempts
  app.get("/api/shipments/:shipmentId/delivery-attempts", authenticateToken, async (req, res) => {
    try {
      const { shipmentId } = req.params;
      const attempts = await storage.getDeliveryAttempts(shipmentId);
      res.json(attempts);
    } catch (error) {
      console.error('Error fetching delivery attempts:', error);
      res.status(500).json({ error: 'Failed to fetch delivery attempts' });
    }
  });

  app.post("/api/shipments/:shipmentId/delivery-attempts", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { shipmentId } = req.params;
      const validatedData = insertDeliveryAttemptSchema.parse({
        ...req.body,
        shipmentId
      });
      const attempt = await storage.createDeliveryAttempt(validatedData);
      res.status(201).json(attempt);
    } catch (error) {
      console.error('Error creating delivery attempt:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create delivery attempt' });
    }
  });

  // === END SHIPPING & LOGISTICS API ROUTES ===

  // QR codes now contain text-only data, no URL redirects needed
  // Customers can scan QR codes directly to see product information

  // Static file serving for uploads
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}
