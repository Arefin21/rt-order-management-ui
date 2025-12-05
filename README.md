# RT Order Management UI

Frontend application for RT Order Management System built with Next.js 15.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following content:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_APP_NAME=OrderManagement
```

**Note:** If your Laravel API is running on a different URL, update `NEXT_PUBLIC_API_URL` accordingly.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Authentication system with JWT
- Dashboard
- Billing page with product autocomplete
- Orders management with filters and pagination
- Order edit and delete functionality

## API Base URL

Default: `http://127.0.0.1:8000/api`

