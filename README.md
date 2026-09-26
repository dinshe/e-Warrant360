# e-warrant360 — Secure Multi-Tenant Warranty Management SaaS

**Production-grade digital warranty management platform engineered for small and medium-sized shops (SMBs) in Sri Lanka.**

---

## 📌 Executive Summary

**e-warrant360** eliminates paper warranty cards, lost receipts, and unverified warranty claims. It provides Sri Lankan electronics retailers, appliance shops, hardware stores, and mobile merchants with a fast, mobile-friendly dashboard to:

1. **Onboard & Brand Their Shop** with Sri Lankan business registration details, districts, and provinces.
2. **Catalog Products** with custom default warranty periods (6, 12, 24, 60 months) and serial number tracking policies.
3. **Issue Digital Warranties in Under 30 Seconds** via a streamlined 4-step workflow that auto-populates terms, dates, and pricing.
4. **Generate Instant QR Verification Codes & Digital Certificates** printable or accessible by customers without requiring any mobile app or complex account.
5. **Enforce Cryptographic Public Verification** with anti-enumeration protection and partial data masking (phone, email, serial).
6. **Manage Full Warranty Lifecycle & Service Claims** (Under Review, Service, Repair, Replacement, or Rejection).
7. **Transfer Ownership & Track Serial Replacements** with complete, immutable audit logs preserving original purchase timelines.
8. **Integrate with POS / External Ingestion** via dedicated integration adapters and webhook receivers.

---

## 🏛️ Architecture & Security Baseline

e-warrant360 is built as a **Modular Monolith** in **Next.js 15 App Router** using **Prisma ORM** with **PostgreSQL**.

### Multi-Tenancy Architecture
- **Tenant Isolation**: Every customer, product, warranty, claim, and audit log is strictly scoped to a `shopId`.
- **Backend Derivation**: Tenant context is derived exclusively from the authenticated user's server-side session. Client-supplied `shopId` values in request bodies are ignored.
- **Cross-Tenant Attack Prevention**: Every database query in the service layer enforces `where: { shopId }`.

### Security Controls (Defensively Aligned with OWASP ASVS 5.0)
- **Password Security**: Salted bcrypt hashing with 12 cost rounds.
- **Brute-Force Defense**: Progressive lockout (5 failed attempts locks the account for 15 minutes).
- **Public Verification Privacy**: Customer phone (`077****67`), email (`ka***@domain.com`), and hardware serial numbers (`SN-***102`) are partially masked on public endpoints to prevent data scraping.
- **Enumeration Defense**: Warranty public lookup uses high-entropy random verification tokens (48-char hex) and DB-backed rate limiting per IP.
- **Formula Injection Mitigation**: CSV exports sanitize spreadsheet cells starting with `=`, `+`, `-`, or `@` to prevent CSV formula execution in Excel/Google Sheets.
- **State Machine Integrity**: Strict server-side validation rejects invalid status jumps (e.g. `DRAFT` directly to `COMPLETED` is rejected; `EXPIRED` and `VOIDED` are immutable terminal states).

---

## 🛠️ Technology Stack

| Layer | Technology | Selection Rationale |
|---|---|---|
| **Framework** | Next.js 15 (App Router, Server Actions, API Routes) | Full-stack TypeScript, edge-ready, zero-cost deployment on Vercel |
| **Language** | TypeScript 5.6 | Strict compile-time safety across schemas, models, and UI |
| **Database** | PostgreSQL | Relational integrity, foreign keys, transaction boundaries, RLS capability |
| **ORM** | Prisma 6 | Type-safe migrations, prevents raw SQL injection, schema-first |
| **Authentication** | NextAuth.js v5 (Auth.js) + bcrypt | Battle-tested session management, database sessions, credential provider |
| **UI Components** | Tailwind CSS + Lucide Icons + Radix UI | Modern clean SaaS interface, fully responsive for mobile screens |
| **Validation** | Zod | Runtime input validation shared between frontend forms and API routes |
| **Verification & QR** | react-qr-code + qrcode | Pure SVG and PNG client-side and server-side rendering, zero external APIs |
| **Testing** | Vitest | High-speed unit and state-machine verification suite |
| **Deployment** | Docker & Vercel (Free-Tier Ready) | Zero-cost initial operations on Neon/Supabase PostgreSQL and Vercel |

---

## 🇱🇰 Sri Lankan Localization

- **Currency**: Native formatting in Sri Lankan Rupees (`LKR` / `Rs.`) with locale-aware number separation.
- **Timezone**: Explicitly set to `Asia/Colombo` (`UTC+05:30`) across all date calculations.
- **Phone Validation**: Validation for Sri Lankan standard mobile patterns (`07X-XXXXXXX` and `+947X-XXXXXXX`).
- **Geographic Modeling**: Built-in support for all 9 Sri Lankan Provinces (`WESTERN`, `CENTRAL`, `SOUTHERN`, etc.) and all 25 Districts (`Colombo`, `Gampaha`, `Kandy`, `Galle`, etc.).
- **Business Registration**: Official support for business registration (BR) numbers on printed digital certificates.

---

## 📁 Project Directory Structure

```
e-Warrant360/
├── prisma/
│   ├── schema.prisma                  # Comprehensive relational database schema
│   └── seed.ts                        # Sri Lankan SMB demo seed data generator
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Authentication routes (login, register)
│   │   ├── (dashboard)/               # Protected seller merchant portal
│   │   │   ├── dashboard/             # KPIs, stats, recent warranties
│   │   │   ├── warranties/            # Warranty list, detail, and 4-step creation
│   │   │   ├── products/              # Catalogue, pricing, warranty rules
│   │   │   ├── customers/             # Customer directory and warranty history
│   │   │   ├── claims/                # Service claims and inspection workflows
│   │   │   ├── staff/                 # Staff team management and invitations
│   │   │   ├── settings/              # Shop profile and Sri Lanka localization
│   │   │   └── audit/                 # Immutable security audit trail
│   │   ├── admin/                     # Platform super-admin tenant manager
│   │   ├── verify/                    # Public customer verification portal
│   │   │   └── [token]/               # Live cryptographically verified certificate
│   │   └── api/                       # REST API & Webhook endpoints
│   ├── components/
│   │   ├── layout/                    # Sidebar and Header components
│   │   ├── ui/                        # Button, Card, Badge, Input, Table, etc.
│   │   └── warranties/                # Certificate, QR generator, status badges
│   ├── lib/
│   │   ├── auth.ts                    # NextAuth credentials & session callbacks
│   │   ├── db.ts                      # Prisma client singleton
│   │   ├── utils.ts                   # Date calculations, formatting, masking
│   │   ├── validations.ts             # Zod validation schemas
│   │   ├── services/
│   │   │   ├── warranty.service.ts    # Warranty state machine & issuance logic
│   │   │   └── notification.service.ts# Swappable notification adapter
│   │   └── integrations/
│   │       └── pos.ts                 # POS & ERP ingestion service
│   └── middleware.ts                  # Edge authentication & route protection
├── tests/                             # Automated Vitest test suites
├── Dockerfile                         # Production multi-stage Docker build
├── docker-compose.yml                 # Local app + PostgreSQL 16 stack
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20 or v22 LTS
- **npm**: v10+
- **PostgreSQL**: Local instance OR free cloud instance from [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com).

### 1. Environment Setup
Copy the environment template:
```bash
cp .env.example .env.local
```

Ensure `DATABASE_URL` is configured in `.env.local`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ewarrant360?schema=public"
NEXTAUTH_SECRET="your-secure-random-secret-key-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-secure-random-secret-key-at-least-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Database Migration & Client Generation
```bash
# Push schema to database
npx prisma db push

# Generate type-safe Prisma Client
npx prisma generate
```

### 3. Populate Sri Lankan Demo Seed Data
```bash
npm run db:seed
```

This seeds:
- **Platform Admin**: `admin@ewarrant360.lk` (Password: `AdminPass123!`)
- **Demo Shop**: **Colombo Tech Mart** (142 Galle Road, Bambalapitiya, Colombo 04)
- **Shop Owner**: `kasun@colombotech.lk` (Password: `SellerPass123!`)
- **Shop Staff**: `nuwan@colombotech.lk` (Password: `StaffPass123!`)
- **Products**: Samsung 55" 4K TV, LG Dual Inverter AC, JBL Charge 5 Speaker
- **Customers & Warranties**: Active, Expiring Soon, and In-Service warranties with sample claims

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Running Automated Tests

Run the test suite:
```bash
npm run test
```

Test coverage includes:
- **Warranty Calculations**: Expiry dates, multi-year durations, days-to-expiry calculation.
- **State Machine**: Valid transitions vs. illegal status transitions.
- **Security Masking**: Data privacy masking for phones, emails, and hardware serials.
- **Defensive Validation**: Sri Lankan phone validation, password complexity, and Zod input schemas.

---

## 🔌 Future POS Integration API

External POS terminals or e-commerce webhooks can issue warranties automatically by sending a `POST` request to `/api/integrations/pos/webhook`:

```json
POST /api/integrations/pos/webhook
Content-Type: application/json

{
  "shopSlug": "colombo-tech-mart",
  "apiKey": "ew360_live_samplekey98213",
  "transactionId": "POS-2024-99881",
  "saleDate": "2024-05-20",
  "invoiceNumber": "INV-77291",
  "customer": {
    "name": "Sunil Perera",
    "phone": "0771234567",
    "email": "sunil@gmail.com",
    "address": "Colombo 03"
  },
  "item": {
    "productName": "Samsung 55\" Crystal UHD 4K Smart TV",
    "sku": "SAM55TV",
    "serialNumber": "SN-SAM55-99812",
    "unitPrice": 185000,
    "warrantyMonthsOverride": 24
  }
}
```

The system:
1. Verifies shop status.
2. Checks transaction idempotency to prevent duplicates.
3. Automatically creates/links the customer and product.
4. Generates the digital warranty and returns the verification URL.

---

## 🐳 Docker Deployment

To launch the complete application with PostgreSQL in Docker:

```bash
docker-compose up -d --build
```
The application will be live at `http://localhost:3000`.

---

## 📄 License
Commercial proprietary software designed for Sri Lankan SMBs.
© 2024 e-warrant360. All rights reserved.
