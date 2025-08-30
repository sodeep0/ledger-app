# LedgerPro - Business Ledger Management System

A comprehensive business ledger management system with a modern, responsive UI for managing suppliers, customers, and transactions.

## Features

### 🏠 Dashboard
- **KPI Cards**: Total Suppliers, Customers, Transactions This Month, Outstanding Balances
- **Interactive Charts**: 
  - Income vs Expenses (Last 12 Months)
  - Party Split Donut Chart (Suppliers vs Customers)
  - Monthly Transaction Volume (Last 6 Months)
- **Recent Transactions Table**: Last 5 transactions with status indicators

### 👥 Parties Management
- **Dual Tabs**: Separate views for Suppliers and Customers
- **Advanced Search**: Search by name, contact, or balance
- **Sorting Options**: Sort by name, balance, or last transaction date
- **CRUD Operations**: Add, edit, and delete parties with form validation
- **Contact Validation**: Email and phone number format validation
- **Empty States**: Helpful messages when no parties exist

### 📝 Transactions Management
- **Comprehensive Filters**:
  - Date range picker (Today, Week, Month, Quarter, Year)
  - Party type filter (Supplier/Customer)
  - Specific party selection
  - Status filter (Paid/Unpaid)
  - Search functionality
- **Export Functionality**: CSV export with formatted data
- **Pagination**: Configurable page sizes (10, 25, 50, 100)
- **Summary Footer**: Total transactions, amounts, paid/unpaid counts
- **Form Validation**: Inline error messages and required field validation

### 🎨 UI/UX Improvements
- **Sidebar Navigation**: Clean, responsive sidebar with active state indicators
- **Modern Design**: Consistent typography, spacing, and color scheme
- **Responsive Layout**: Optimized for desktop and tablet
- **Form Validation**: Real-time validation with inline error messages
- **Loading States**: Proper loading indicators and error handling
- **Modal System**: Reusable modal components for forms

## Technology Stack

### Frontend
- **React 19** with modern hooks
- **React Router DOM** for navigation
- **Tailwind CSS** for styling
- **Axios** for API communication
- **Vite** for build tooling

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** authentication
- **RESTful API** design

## API Endpoints

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Transactions
- `GET /api/transactions` - Get transactions with filtering
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ledger-app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   Create `.env` file in the backend directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ledger-app
   JWT_SECRET=your-secret-key
   PORT=5001
   ```

5. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```

6. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

## Key Improvements Made

### 1. Navigation & Layout
- Implemented sidebar navigation with active states
- Added responsive design for mobile and tablet
- Improved header with search functionality

### 2. Dashboard Enhancements
- Added KPI cards with icons and proper styling
- Implemented interactive charts (mock data for demonstration)
- Added recent transactions table
- Improved visual hierarchy and spacing

### 3. Parties Management
- Created dedicated Parties page with tabs
- Added search and sort functionality
- Implemented CRUD operations with validation
- Added empty states and helpful messages

### 4. Transactions Management
- Comprehensive filtering system
- Export functionality (CSV)
- Pagination with configurable page sizes
- Summary statistics
- Improved form validation

### 5. Form Validation
- Real-time validation with inline error messages
- Required field validation
- Date validation (no future dates)
- Amount validation (positive numbers)
- Contact information validation

### 6. Backend Enhancements
- Added filtering support for transactions
- Improved error handling
- Enhanced API responses

## Usage

1. **Register/Login**: Create an account or log in to access the system
2. **Dashboard**: View business overview with KPIs and charts
3. **Parties**: Manage suppliers and customers with full CRUD operations
4. **Transactions**: Create, view, filter, and export transaction data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
