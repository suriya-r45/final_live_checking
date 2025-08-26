# Overview

This is a jewelry management and e-commerce system for Palaniappa Jewellers. The application provides a public-facing website for customers to browse products and an admin dashboard for managing inventory and billing. Built with a modern full-stack architecture using React for the frontend and Express.js for the backend, the system supports dual-currency pricing (INR and BHD) and includes WhatsApp integration for customer inquiries.

## Recent Changes (August 2025)
- **Estimates Page Complete Fix (August 26, 2025)**: Successfully resolved the blank estimates page issue by implementing proper authentication checks and error handling in both EstimateForm and EstimatesList components, created sample estimates in database for testing functionality, and ensured proper authentication flow requiring admin login before accessing estimate features
- **Performance Optimization for Product Creation (August 26, 2025)**: Significantly enhanced product addition speed by implementing asynchronous barcode generation, optimized database queries using SQL MAX function instead of full table scans, improved connection pooling with configured limits, optimistic UI updates using React Query cache manipulation, and deferred non-critical operations like barcode image generation to improve perceived performance from slow to near-instant product creation
- **Migration to Native Replit Environment (August 26, 2025)**: Successfully migrated jewelry e-commerce application from Replit Agent to native Replit environment with optimized database connection pooling, enhanced React Query configuration for better caching, and improved workflow performance ensuring seamless operation on port 5000
- **Perfect Mobile Category Grid Alignment (August 25, 2025)**: Completely resolved mobile home page category section alignment issues by implementing perfect 4x4 grid layout with uniform spacing (gap-1), consistent text area heights (min-h-[60px]), flexbox centering for all category cards, reduced padding (p-1.5), and tight text spacing (leading-tight) ensuring identical visual appearance across all 16 category items including proper display of Bridal Collections on mobile
- **Bill Generation Navigation Fix (August 25, 2025)**: Fixed critical routing issue where bill generation was incorrectly navigating to Add Product section instead of Bills History tab by replacing window.location.href with proper wouter navigation (setLocation) in both create and update bill mutations, ensuring seamless user experience after bill creation
- **Responsive Collections Grid with Perfect Mobile Alignment (August 21, 2025)**: Implemented responsive product grid - mobile 3x2 layout (6 items per page) and desktop 5x3 layout (15 items per page) with dynamic pagination that adapts to screen size, ultra-tight gap spacing (gap-0.5), minimal container padding (px-0.5), and flexbox-based card structure ensuring perfect vertical alignment across all grid positions
- **Mobile Bottom Navigation (August 21, 2025)**: Implemented fixed bottom navigation bar for mobile devices on collections pages only (appears when users click "View All Gold", "View All Silver", etc.) with Categories, Sort, and Filter options using rose/red gradient colors (#881337 to #7f1d1d), featuring bottom sheet overlays for comprehensive product filtering and sorting similar to CaratLane's mobile interface
- **Product Material Selection (August 21, 2025)**: Added material dropdown to admin product creation form with options including Gold 22K, Gold 18K, Silver 925, Diamond, Pearl, and "New Arrivals" tag, allowing proper product categorization and section placement control
- **Product Section Exclusivity Fix (August 21, 2025)**: Fixed duplicate product display issue where gold jewelry appeared in both "Gold Collection" and "New Arrivals" sections by implementing exclusive filtering logic that prevents products from appearing in multiple homepage sections simultaneously
- **Mobile Header Alignment (August 21, 2025)**: Improved country dropdown alignment in mobile header with better text sizing, spacing adjustments, and compact layout for optimal mobile display
- **Login Page Color Update (August 21, 2025)**: Updated login page with elegant rose/red gradient header featuring deep burgundy (rose-900) to wine red (red-900) gradient, white background, and rose-themed buttons and tabs for consistent luxury jewelry store branding
- **Complete Replit Migration (August 21, 2025)**: Successfully completed full migration from Replit Agent to native Replit environment including PostgreSQL database setup, all API keys configured (Stripe, Twilio, JWT), database schema migration, and application running optimally on port 5000
- **PDF Alignment Fix (August 21, 2025)**: Fixed "TOTAL AMOUNT TO BE PAID" section alignment in PDF bills to ensure proper containment within page margins and prevent text overflow beyond document boundaries
- **WhatsApp Number Update (August 22, 2025)**: Updated WhatsApp business number to +919597201554 (Indian number) across all contact points including footer, product enquiry buttons, and general messaging integrations with green color styling for phone number display
- **Warm Champagne/Rose Gold Color Theme (August 20, 2025)**: Updated entire application to elegant warm champagne/rose gold color palette featuring Champagne Beige (#C08C6A) to Light Nude (#E3C7AF) background gradient, Rose Gold (#C98A6B) primary accents, Pure White (#FFFFFF) headings, and Soft Warm Gray (#DDDDDD) body text for sophisticated jewelry store aesthetics
- **Accurate Gold Rate Integration (August 20, 2025)**: Implemented proper daily gold rate updates with verified market data - Salem Tamil Nadu (₹9,180/gram for 22K gold) and Bahrain (BHD 38.40/gram for 22K gold) rates using reliable API sources with automatic daily updates and fallback mechanisms
- **Mobile Cart Drawer Fix (August 20, 2025)**: Completely resolved mobile cart transparency issue by implementing inline styles approach, removing CSS inheritance problems, and ensuring solid white background across all mobile devices
- **Customer Estimation System (August 19, 2025)**: Created comprehensive estimation system allowing admins to create detailed jewelry quotes for customers with automatic pricing calculations, WhatsApp integration for sending estimates, and complete estimate management workflow including database schema, forms, and tracking
- **Enhanced WhatsApp Integration**: Updated WhatsApp number to +919597201554 (Indian number), added WhatsApp enquiry buttons on all product cards, and enhanced product-specific enquiry messaging with detailed product information
- **Enhanced Product Details**: Added detailed product descriptions with "Why Choose This Piece?" section and comprehensive specifications
- **WhatsApp Integration Enhancement**: Added WhatsApp enquiry buttons on main product image and all thumbnails with specific product messaging, plus global WhatsApp button in header for general inquiries
- **Admin Product Creation Fix**: Resolved product creation issues with improved error handling, flexible schema validation, and proper authentication
- **Enhanced PDF Bill Generation**: Completely redesigned PDF bills with professional formatting, removed standard gold rates section, improved table structure with golden headers, better payment summary layout, and proper visibility for all text elements
- **Indian Payment Options**: Added GPay, PhonePe, and Paytm payment methods specifically for Indian customers alongside existing Stripe integration
- **Admin Login Fix**: Resolved admin authentication redirect issue using proper wouter navigation instead of window.location
- **Enhanced Filtering & Sorting**: Added advanced sorting options including weight-based sorting, popularity, ratings, and stock-first sorting
- **Improved Filter System**: Enhanced product filters with better categorization and real-time price range sliders
- **Better Product Navigation**: Enhanced navigation from product cards to individual detail pages with improved user flow
- **Stripe Configuration Fix**: Corrected Stripe public key configuration to resolve "secret key with Stripe.js" error
- **Premium Design Enhancement**: Completely redesigned with luxurious styling featuring animated gradients, glass morphism effects, sophisticated shadows, premium buttons with shimmer animations, and enhanced typography with larger hero text
- **Currency Default Changed**: Set Bahrain Dinar (BHD) as the default currency instead of Indian Rupees (INR)  
- **Removed Product Details Elements**: Removed warranty information and "Why Choose This Piece?" sections from product details page as requested

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL (Neon database)
- **Authentication**: JWT-based authentication with role-based access control
- **File Upload**: Multer middleware for handling product image uploads
- **API Design**: RESTful API structure with centralized error handling

## Data Storage
- **Database**: PostgreSQL using Neon serverless database
- **Schema**: Three main entities - users (admin/guest roles), products (with dual pricing), and bills (with customer and item details)
- **File Storage**: Local filesystem storage for uploaded product images
- **Migrations**: Drizzle Kit for database schema management

## Authentication & Authorization
- **JWT Tokens**: Stored in localStorage for session management
- **Role-based Access**: Admin and guest user roles with different permissions
- **Protected Routes**: Admin dashboard requires authentication and admin role
- **Hardcoded Admin**: Single admin account with predefined credentials

## External Integrations
- **WhatsApp Business**: Direct integration for customer inquiries with product details
- **PDF Generation**: Server-side PDF creation using PDFKit for bills and invoices
- **Image Handling**: Support for JPEG, PNG, and WebP formats with file size limits

## Key Features
- **Multi-currency Support**: Dual pricing in Indian Rupees (INR) and Bahrain Dinar (BHD)
- **Product Management**: Full CRUD operations for jewelry inventory with image uploads
- **Billing System**: Complete invoicing with customer details, item management, and PDF export
- **Responsive Design**: Mobile-first approach with dark mode support
- **Real-time Updates**: Optimistic updates and automatic cache invalidation

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database queries and schema management

## UI & Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Fast build tool with HMR and TypeScript support
- **ESBuild**: Fast JavaScript bundler for production builds
- **TSX**: TypeScript execution environment for development

## Authentication & Security
- **bcryptjs**: Password hashing for secure authentication
- **jsonwebtoken**: JWT token generation and verification

## File Processing
- **Multer**: Multipart form data handling for file uploads
- **PDFKit**: PDF document generation for bills and reports

## Communication
- **WhatsApp Web API**: Direct messaging integration for customer support

## Testing & Quality
- **TypeScript**: Static type checking and enhanced developer experience
- **Zod**: Runtime type validation and schema parsing