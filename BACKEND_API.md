# Elikem Website Backend API

This document describes the backend API endpoints and configuration for the Elikem website using ERPNext as the backend.

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# ERPNext Configuration
ERPNEXT_API_URL=https://erp-elikem.l.frappe.cloud/
ERPNEXT_API_KEY=your-api-key
ERPNEXT_API_SECRET=your-api-secret

# Optional: Books list API columns if ERPNext returns 417 (comma-separated, no spaces)
# ERPNEXT_BOOKS_LIST_FIELDS=name,book_name,book,image,modified,is_free,is_amazon,is_preorder,amazon_url

# Newsletter Cache TTL (in milliseconds, default 5 minutes)
NEWSLETTER_CACHE_TTL_MS=300000

# Server Configuration
API_PORT=3001

# Client Configuration
VITE_USE_GOOGLE_API=false
# Public site origin for blog images (same host as ERPNEXT_API_URL; no API secret)
VITE_ERPNEXT_PUBLIC_URL=https://erp-elikem.l.frappe.cloud
```

### Required ERPNext Doctypes

This application requires the following ERPNext doctypes to be set up:

1. **Subscribers** - Stores newsletter subscriber information
   - Fields: `email` (Email field)

2. **Book** - Stores book information and metadata
   - Fields: `title` (Text), `description` (Text Editor), `file_url` (URL)

3. **Books** — site catalog (`/books` page, `GET /api/books/catalog`) and newsletter “free gift” block (`GET /api/books/footer/latest`). Doctype name can be overridden with `ERPNEXT_BOOKS_DOCTYPE` (default `Books`).
   - Typical fields: `book_name`, `book` (Attach / file URL), `image` (Attach), description (`description` / `book_description` / **`ERPNEXT_BOOKS_DESCRIPTION_FIELD`**)
   - Optional flags (Check or equivalent): `is_free` (on-site read + download when `book` is a public `http(s)` URL), `is_amazon` + `amazon_url`, `is_preorder` (pre-order form on **`/books`**; legacy path **`/books/preorder/:id`** redirects to **`/books?preorder=:id`**) + `POST /api/books/preorder`

4. **Book Order** - Stores book order information
   - Fields: `email` (Email), `customer_name` (Text), `book_title` (Text), `quantity` (Int), `delivery_address` (Text), `phone` (Text), `order_date` (Datetime)

5. **Pre-Order** — rows created from the site pre-order form (`POST /api/books/preorder`). Doctype name override: **`ERPNEXT_PREORDER_DOCTYPE`** (default `Pre-Order`). Default field API names: **`book`** (Link to **Books** document name), **`email`**, **`full_name`**, **`phone_number`**, **`quantity`** (integer 1–999). Override with **`ERPNEXT_PREORDER_BOOK_FIELD`**, **`ERPNEXT_PREORDER_EMAIL_FIELD`**, **`ERPNEXT_PREORDER_FULL_NAME_FIELD`**, **`ERPNEXT_PREORDER_PHONE_FIELD`**, **`ERPNEXT_PREORDER_QUANTITY_FIELD`**. Optional **`ERPNEXT_PREORDER_NAMING_SERIES`**.

6. **Feedback** (DocType name may be `Feedback`) — contact / feedback from the site
   - Fields (default API names; match **Customize Form** or override with env):
     - `name__organization` — Name / Organization (Frappe `__` when the label contains `/`; override with `ERPNEXT_FEEDBACK_NAME_ORG_FIELD`)
     - `email` — Email (optional if phone is sent)
     - `phone_number` — Phone Number (`ERPNEXT_FEEDBACK_PHONE_FIELD`, default `phone_number`)
     - `feedback_type` — Feedback Type (Select); option text must match what the site sends (see `TOPICS` labels in `EnquiryForm.tsx`)
     - `feedback` — body text (“What do you want us to know?”)


## API Endpoints

### Newsletter Management

#### Verify Email Subscription
```
POST /api/newsletter/verify
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "subscribed": true
}
```

#### Subscribe Email to Newsletter
```
POST /api/newsletter/subscribe
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "subscribed": true
}
```

### Access Token Management

#### Get Access Token (for Premium Downloads)
```
POST /api/access/token
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "token": "jwt-token-here"
}

Note: User must be subscribed to newsletter to get a token.
```

### Books & Downloads

#### List All Available Books
```
GET /api/books

Response:
{
  "books": [
    {
      "id": "file-id",
      "name": "Book Title",
      "mimeType": "application/pdf",
      "size": "1024000",
      "modifiedTime": "2026-05-22T10:00:00Z",
      "preview": "First 500 characters of content..."
    }
  ]
}
```

#### List all **Books** doctype rows (public catalog page)

Uses the same ERPNext doctype as the newsletter “free gift” block (`Books` by default, or `ERPNEXT_BOOKS_DOCTYPE`). Each item includes cover image URL, description, file link, and optional sale flags.

```
GET /api/books/catalog

Response:
{
  "books": [
    {
      "id": "BOOKS-00001",
      "bookName": "Title from ERPNext",
      "description": "Plain or HTML description text",
      "imageUrl": "https://your-site/files/…",
      "bookUrl": "https://your-site/files/…pdf",
      "isFree": true,
      "isAmazon": false,
      "isPreorder": false,
      "amazonUrl": null
    }
  ]
}
```

#### Get one **Books** row (by ERPNext `name`)

```
GET /api/books/catalog/:bookId

Response: { "book": { ... same shape as one catalog item ... } }
```

#### Stream free book PDF for on-site reader (same-origin)

Proxies the **Books** `book` file through this app so the PDF can load in an **embed** on your site. Direct ERPNext file URLs often set **`X-Frame-Options: SAMEORIGIN`**, which blocks embedding from `localhost` or another host.

The server loads the full file into memory (cap **80 MB**), checks for a **`%PDF`** header, then responds with **`Content-Length`** so downloads are not truncated. It tries, in order: direct URL with **token** auth, **Basic** auth, then **`/api/method/download_file`** and the legacy **`frappe.utils.file_manager.download_file`** (same-site URLs only).

- Allowed only when the book has **`isFree: true`** and a valid **`http(s)`** `bookUrl`.
- **`?attachment=1`** — `Content-Disposition: attachment` for download (includes an ASCII `filename=` for browser compatibility).

```
GET /api/books/read/:bookId/stream
GET /api/books/read/:bookId/stream?attachment=1
```

Response: binary stream (`Content-Type` from upstream, usually `application/pdf`). Status **`403`** if not a free on-site title, **`502`** if the file URL cannot be fetched.

#### Submit a pre-order (creates **Pre-Order** in ERPNext)

Requires the **Books** row to have `is_preorder` set. Body sends the Books document **`name`** as `book` (not the display title). On success, the **`email`** is added to the newsletter **Subscribers** list in ERPNext if that address is not already subscribed (best-effort; pre-order still succeeds if this step fails).

```
POST /api/books/preorder
Content-Type: application/json

{
  "book": "BOOKS-00001",
  "email": "reader@example.com",
  "full_name": "Jane Reader",
  "phone_number": "+1 234 567 8900",
  "quantity": 2
}

Response:
{
  "ok": true,
  "docName": "PRE-ORDER-00001"
}
```

Error JSON examples: `{ "ok": false, "reason": "not_preorder" }`, `{ "ok": false, "reason": "book_not_found" }`, `{ "ok": false, "reason": "invalid_email" }`, `{ "ok": false, "reason": "missing_full_name" }`, `{ "ok": false, "reason": "missing_phone" }`, `{ "ok": false, "reason": "invalid_phone" }`, `{ "ok": false, "reason": "invalid_quantity" }`.

#### List Recent Book Previews (Public)
```
GET /api/drive/previews

Response:
{
  "files": [
    {
      "id": "file-id",
      "name": "Recent Book",
      "mimeType": "application/pdf",
      "preview": "..."
    }
  ]
}
```

#### Download Book (Requires Token)
```
GET /api/drive/download/:fileId?token=jwt-token-here

Headers:
Authorization: Bearer jwt-token-here

Response: File stream (binary)
```

### Book Ordering

#### Create Book Order
```
POST /api/books/order
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "bookTitle": "The Art of Building",
  "quantity": 2,
  "deliveryAddress": "123 Main St, City, Country",
  "phone": "+1-234-567-8900"
}

Response:
{
  "ordered": true,
  "message": "Order placed successfully"
}
```

### Website feedback (ERPNext Feedback)

The contact form is served at **`/contact`** in the site (not on the home page).

#### Submit feedback / enquiry
```
POST /api/enquiry
Content-Type: application/json

{
  "name": "Jane Doe or Org name",
  "email": "jane@example.com",
  "phone": "+233 …",
  "topic": "general",
  "message": "What you want us to know."
}
```

**At least one** of `email` or `phone` must be non-empty. If `email` is set, it must be valid. `message` (mapped to the **Feedback** field in ERPNext) is required.

`topic` is one of: `general`, `pastor`, `data-analyst`, `writer`. It is stored in **Feedback Type** as the display label (e.g. `General`, `Pastoral / spiritual`). Those labels must exist as **Select** options on your Feedback DocType, or change the labels in `src/components/EnquiryForm.tsx` to match ERPNext.

**Response**
```json
{ "ok": true, "docName": "CRM-FEEDBACK-2026-00001" }
```

**Optional env (field / doctype overrides)**

```env
ERPNEXT_FEEDBACK_DOCTYPE=Feedback
ERPNEXT_FEEDBACK_EMAIL_FIELD=email
ERPNEXT_FEEDBACK_PHONE_FIELD=phone_number
ERPNEXT_FEEDBACK_TYPE_FIELD=feedback_type
ERPNEXT_FEEDBACK_NAME_ORG_FIELD=name__organization
ERPNEXT_FEEDBACK_BODY_FIELD=feedback
ERPNEXT_FEEDBACK_NAMING_SERIES=
```

If your field API names differ (e.g. Frappe generated `name__organization`), set the matching `ERPNEXT_FEEDBACK_*` variable.

#### Get User's Book Orders (Requires Token)
```
GET /api/books/my-orders?token=jwt-token-here

Headers:
Authorization: Bearer jwt-token-here

Response:
{
  "orders": [
    {
      "timestamp": "2026-05-22T10:00:00Z",
      "email": "user@example.com",
      "name": "John Doe",
      "bookTitle": "The Art of Building",
      "quantity": 2,
      "deliveryAddress": "123 Main St, City, Country",
      "phone": "+1-234-567-8900"
    }
  ]
}
```

#### List Drive Files (Requires Token)
```
GET /api/drive/list?token=jwt-token-here

Headers:
Authorization: Bearer jwt-token-here

Response:
{
  "files": [
    {
      "id": "file-id",
      "name": "Book or Document",
      "mimeType": "application/pdf",
      "size": "1024000",
      "modifiedTime": "2026-05-22T10:00:00Z",
      "preview": "Content preview..."
    }
  ]
}
```

## Backend Structure

- **`server/index.ts`** - Express server setup and middleware
- **`server/routes.ts`** - API route definitions
- **`server/erpnextAuth.ts`** - ERPNext API authentication and request handling
- **`server/newsletterStore.ts`** - Newsletter subscription management (using ERPNext Subscribers)
- **`server/ordersStore.ts`** - Book order management (using ERPNext Book Order)
- **`server/driveStore.ts`** - Books management (using ERPNext Book doctype)
- **`server/booksStore.ts`** - **Books** doctype (site catalog + newsletter “latest book”); `GET /api/books/catalog`, single-book GET, footer latest
- **`server/preorderStore.ts`** - **Pre-Order** doctype inserts from `POST /api/books/preorder`
- **`server/accessToken.ts`** - JWT token generation and verification
- **`server/static.ts`** - Static file serving for production
- **`server/vite.ts`** - Vite integration for development

## ERPNext Setup

### API Key and Secret

1. Log in to your ERPNext instance
2. Navigate to **User Profile** → **API Access**
3. Generate a new API Key and API Secret
4. Copy these credentials to `.env`:
   - `ERPNEXT_API_KEY`
   - `ERPNEXT_API_SECRET`

### Create Required Doctypes

#### 1. Subscribers Doctype

This stores newsletter subscribers with their email addresses:

- Go to **Developer → Doctype → New**
- Name: `Subscribers`
- Autoname: `email`
- Fields:
  - `email` (Email, Unique, Mandatory)

#### 2. Book Doctype

This stores book information and file URLs:

- Name: `Book`
- Autoname: `title`
- Fields:
  - `title` (Data/Text, Mandatory)
  - `description` (Text Editor, Optional)
  - `file_url` (URL, Optional - link to downloadable file)

#### 3. Books Doctype (site catalog & newsletter)

Used by **`/books`**, **`GET /api/books/catalog`**, **`GET /api/books/footer/latest`**, and the free-gift flow. Override the doctype name with **`ERPNEXT_BOOKS_DOCTYPE`** if yours differs from `Books`.

- **`ERPNEXT_BOOKS_LIST_FIELDS`** (optional) — comma-separated column names for the ERPNext **list** API. Use this if the default list returns **417** (unknown or non-list field such as `title` / `description` on your form).

- Name: `Books` (or your custom name in env)
- Fields (align API field names with your form; the app maps common variants):
  - `book_name` (Data) — display title
  - `book` (Attach or URL) — downloadable file (resolved to a public URL)
  - `image` (Attach) — cover
  - Description: `description`, `book_description`, or a custom field set via **`ERPNEXT_BOOKS_DESCRIPTION_FIELD`**
  - `is_free`, `is_amazon`, `is_preorder` (Check) — drive `/books` UI and reader route
  - `amazon_url` (Data or Small Text) — full `https://…` Amazon link when `is_amazon` is set

#### 4. Pre-Order Doctype

Created when a visitor submits **`POST /api/books/preorder`** from the **Books** catalog page (pre-order panel on a card; old URL **`/books/preorder/:bookId`** redirects to **`/books?preorder=`**).

- Name: `Pre-Order` (or set **`ERPNEXT_PREORDER_DOCTYPE`**)
- Fields (defaults; override with env):
  - **`book`** — Link to **Books** (stores the Books document `name`; override **`ERPNEXT_PREORDER_BOOK_FIELD`**)
  - **`email`** — Email (override **`ERPNEXT_PREORDER_EMAIL_FIELD`**)
  - **`full_name`** — Customer name (override **`ERPNEXT_PREORDER_FULL_NAME_FIELD`**)
  - **`phone_number`** — Phone (override **`ERPNEXT_PREORDER_PHONE_FIELD`**)
  - **`quantity`** — Int 1–999 (override **`ERPNEXT_PREORDER_QUANTITY_FIELD`**)
- If the doctype uses **Naming Series**, set **`ERPNEXT_PREORDER_NAMING_SERIES`** (e.g. `PRE-.#####`).
- Inserts use **`?ignore_permissions=1`** unless **`ERPNEXT_PREORDER_RESPECT_PERMISSIONS=1`**.

#### 5. Book Order Doctype

This stores book order information:

- Name: `Book Order`
- Autoname: `BOOK-ORDER-.#####`
- Fields:
  - `email` (Email, Mandatory)
  - `customer_name` (Data, Mandatory)
  - `book_title` (Data, Mandatory)
  - `quantity` (Int, Default 1)
  - `delivery_address` (Text, Optional)
  - `phone` (Data, Optional)
  - `order_date` (DateTime, Auto-populated)

## Error Responses

All error responses follow this format:

```json
{
  "reason": "error_code",
  "message": "Human readable error message"
}
```

Common error codes:
- `missing_email` - Email not provided
- `missing_token` - Authorization token not provided
- `invalid_token` - Token is invalid or expired
- `not_subscribed` - User not subscribed to newsletter
- `file_not_in_allowed_folder` - File not in allowed Drive folder
- `missing_required_fields` - Required fields missing for book order
- `missing_fileId` - File ID not provided

## Development

Start the development server:

```bash
npm run dev
```

The server will be available at `http://localhost:5173` (proxied through Vite) or directly at the configured API port.

## Production Build

Build for production:

```bash
npm run build
```

This will:
1. Build the React client with Vite
2. Bundle the Express server with esbuild
3. Create production-optimized output in the `dist` directory

## Security Notes

- The `.env` file contains sensitive credentials (ERPNext API keys) and should never be committed
- Always use HTTPS in production
- Tokens are JWT-based and expire after a configurable period
- Store your ERPNext API credentials securely in environment variables only
- Restrict ERPNext API key permissions to only necessary doctypes (Subscribers, Book, Books, Book Order, Pre-Order)
