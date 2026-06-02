# Elikem Website Backend API

This document describes the backend API endpoints and configuration for the Elikem website using ERPNext as the backend.

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# ERPNext Configuration
ERPNEXT_API_URL=https://siamae.frappe.cloud/
ERPNEXT_API_KEY=your-api-key
ERPNEXT_API_SECRET=your-api-secret

# Newsletter Cache TTL (in milliseconds, default 5 minutes)
NEWSLETTER_CACHE_TTL_MS=300000

# Server Configuration
API_PORT=3001

# Client Configuration
VITE_USE_GOOGLE_API=false
```

### Required ERPNext Doctypes

This application requires the following ERPNext doctypes to be set up:

1. **Subscribers** - Stores newsletter subscriber information
   - Fields: `email` (Email field)

2. **Book** - Stores book information and metadata
   - Fields: `title` (Text), `description` (Text Editor), `file_url` (URL)

3. **Book Order** - Stores book order information
   - Fields: `email` (Email), `customer_name` (Text), `book_title` (Text), `quantity` (Int), `delivery_address` (Text), `phone` (Text), `order_date` (Datetime)


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

#### 3. Book Order Doctype

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
- Restrict ERPNext API key permissions to only necessary doctypes (Subscribers, Book, Book Order)
