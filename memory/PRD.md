# Pasal Sathi (पसल साथी) - Shop Friend
## Shop Management System for Traditional Nepali Utensil Kiosks

### Original Problem Statement
Build a web-based shop management system for a traditional Nepali utensil kiosk that currently operates 100% offline. The shop sells hundreds of SKUs including steel utensils, brass religious items (diya, kalash, thali), plastic household goods, boxed pressure cookers, hanging cleaning tools, and loose unboxed items.

### User Choices
1. **Language**: Bilingual UI (English + Nepali नेपाली)
2. **Low Stock Alerts**: Simple rule-based (threshold-based, no AI)
3. **Authentication**: Simple PIN-based login (4-6 digits)
4. **Reports**: PDF and Excel export functionality
5. **AI Scanner**: OpenAI GPT-4o for photo-based inventory counting (both Quick and Smart modes)

### Target User Persona
- Traditional Nepali shop owners aged 40-55
- Minimal technology experience
- Using basic Android phones
- Need large touch targets, simple navigation
- Prefer bilingual labels

---

## Architecture

### Tech Stack
- **Frontend**: React 19 + Tailwind CSS + Sonner (toasts)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Authentication**: PIN-based with JWT tokens
- **Export**: OpenPyXL (Excel) + ReportLab (PDF)
- **AI Vision**: OpenAI GPT-4o via Emergent LLM Key
- **PWA**: Service Worker + Manifest for installable app

### Database Collections
1. `shop_config` - Shop settings and PIN hash
2. `products` - Inventory items with categories, locations, pricing
3. `sales` - Transaction records with items, payment type
4. `suppliers` - Vendor information
5. `purchases` - Stock purchase history
6. `scans` - AI scan history and results

---

## Core Requirements (Static)

### P0 - Critical (MVP) ✅
- [x] PIN-based authentication
- [x] Product management (CRUD)
- [x] Visual category-based inventory (Steel/Brass/Plastic/Electric/Religious/Cleaning/Boxed)
- [x] Location tagging (Hanging/Shelf/Storage/Counter/Front Display)
- [x] Quick sale entry (Product → Qty → Cash/Credit)
- [x] Low stock alerts (threshold-based)
- [x] Bilingual UI (English + Nepali)

### P1 - Important ✅
- [x] Supplier management
- [x] Sales history with date filtering
- [x] PDF/Excel report export
- [x] Dashboard with today/week stats
- [x] Discount support in sales
- [x] PWA support (installable on phones)
- [x] **AI Stock Scanner** - Photo-based inventory counting

### P2 - Nice to Have
- [ ] Purchase tracking per supplier
- [ ] Customer credit ledger
- [ ] Festival season alerts
- [ ] Barcode/QR code support
- [ ] Offline mode with sync

---

## What's Been Implemented (January 2025)

### AI Stock Scanner (NEW)
- **Quick Count Mode**: Fast item counting from photos
- **Smart Scan Mode**: Identifies items, counts, matches with inventory, suggests updates
- **GPT-4o Vision**: Powered by OpenAI via Emergent LLM Key
- **Automatic Stock Update**: One-click update inventory from scan results
- **Location Detection**: AI identifies where items are (shelf_top, hanging, etc.)
- **Scan History**: All scans saved for reference

### Authentication System
- PIN-based setup and login
- JWT token authentication (30-day expiry)
- Secure PIN hashing with bcrypt

### Dashboard
- Today's sales total and count
- Weekly sales summary
- Total products count
- Inventory value calculation
- Low stock alerts count
- Recent sales list

### Inventory Management
- 7 product categories with Nepali labels
- 6 location types
- Exact vs Approximate quantity modes
- Cost/Selling price with margin calculation
- Low stock threshold per product
- Search by name (English/Nepali)
- Category filtering

### Sales System
- Quick product search and selection
- Cart management with quantity adjustment
- Discount application
- Cash/Credit payment types
- Customer name (optional)
- Automatic stock deduction

### Reports
- Sales report (Excel/PDF) with date range
- Inventory report (Excel)
- Summary statistics

### Supplier Management
- Add/Edit/Delete suppliers
- Phone and address storage
- Notes field

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/auth/check | Check if shop is setup |
| POST | /api/auth/setup | Initial shop setup |
| POST | /api/auth/login | Login with PIN |
| GET | /api/categories | Get all categories |
| GET | /api/locations | Get all locations |
| GET | /api/products | List products (with filters) |
| POST | /api/products | Create product |
| PUT | /api/products/{id} | Update product |
| DELETE | /api/products/{id} | Soft delete product |
| GET | /api/sales | List sales (date range) |
| GET | /api/sales/today | Today's sales summary |
| POST | /api/sales | Create sale |
| GET | /api/suppliers | List suppliers |
| POST | /api/suppliers | Create supplier |
| PUT | /api/suppliers/{id} | Update supplier |
| DELETE | /api/suppliers/{id} | Soft delete supplier |
| GET | /api/alerts/low-stock | Get low stock products |
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/reports/sales/excel | Export sales to Excel |
| GET | /api/reports/sales/pdf | Export sales to PDF |
| GET | /api/reports/inventory/excel | Export inventory to Excel |

---

## Next Action Items

### Immediate (P1)
1. Add purchase recording linked to suppliers
2. Customer credit tracking (udhaaro ledger)
3. Product image upload support
4. Print receipt feature

### Future (P2)
1. Festival season stock alerts (Dashain, Tihar)
2. Price history tracking
3. Multi-user support with different PINs
4. Offline mode with data sync
5. Barcode scanner integration
6. WhatsApp share for receipts

---

## Design System

### Colors
- Primary: #8B0000 (Simrik Red)
- Secondary: #D4AF37 (Brass Gold)
- Background: #F9F9F5 (Warm Rice Paper)
- Success: #15803D
- Warning: #B45309
- Error: #DC2626

### Typography
- Headings: Manrope
- Body: Inter
- Nepali: Noto Sans Devanagari

### Key UI Patterns
- Large touch targets (48x48px minimum)
- Bottom navigation for mobile
- Visual category icons
- Bilingual labels throughout
- Numpad for quantity entry
