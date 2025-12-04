# API Testing Guide

This directory contains comprehensive API tests for the IT Asset Management System.

## 📋 Prerequisites

```bash
npm install -g newman newman-reporter-html
```

Or install locally:
```bash
npm install --save-dev newman newman-reporter-html
```

## 🚀 Running Tests

### Method 1: Using NPM Script
```bash
npm run test:api
```

### Method 2: Using Newman CLI
```bash
newman run tests/api-tests.postman_collection.json \
  --environment-var "baseUrl=http://localhost:3000" \
  --reporters cli,html \
  --reporter-html-export tests/results/report.html
```

### Method 3: Using Node Script
```bash
node tests/run-api-tests.js
```

## 📦 Test Coverage

The test collection covers the following API endpoints:

### ✅ Health Check
- `GET /api/health` - System health check

### 🔐 Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### 💻 Assets
- `GET /api/assets` - Get all assets
- `POST /api/assets` - Create new asset
- `GET /api/assets/:id` - Get asset by ID
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset
- `GET /api/assets/:id/history` - Get asset history

### 👥 Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### 📦 Inventory
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create new inventory item
- `GET /api/inventory/:id` - Get inventory item by ID
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item
- `POST /api/inventory/dispense` - Dispense inventory
- `POST /api/inventory/return` - Return inventory
- `POST /api/inventory/adjust` - Adjust inventory
- `GET /api/inventory/dashboard` - Get inventory dashboard stats
- `GET /api/inventory/reports` - Get inventory reports

### 📚 Borrowing
- `GET /api/borrowing` - Get all borrow records
- `POST /api/borrowing` - Checkout asset
- `GET /api/borrowing/:id` - Get borrow record by ID
- `PUT /api/borrowing/:id` - Checkin asset

### 🔧 Patches
- `GET /api/patches` - Get all patch records
- `POST /api/patches` - Create patch record
- `GET /api/patches/:id` - Get patch by ID
- `PUT /api/patches/:id` - Update patch
- `DELETE /api/patches/:id` - Delete patch
- `GET /api/patches/:id/history` - Get patch history

### 📊 Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## 🔧 Configuration

### Environment Variables

Create a `.env.test` file:

```env
API_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
```

### Postman Variables

The collection uses the following variables:
- `baseUrl` - API base URL (default: http://localhost:3000)
- `assetId` - Dynamically set from test responses
- `userId` - Dynamically set from test responses
- `borrowId` - Dynamically set from test responses
- `inventoryId` - Dynamically set from test responses
- `patchId` - Dynamically set from test responses

## 📊 Test Reports

After running tests, reports are generated in `tests/results/`:
- `api-test-report.html` - HTML report with detailed results
- `api-test-results.json` - JSON format for CI/CD integration

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Start server
        run: npm run dev &
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      - name: Run API tests
        run: npm run test:api
      - name: Upload test results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: tests/results/
```

## 🐛 Troubleshooting

### Server not running
Make sure your development server is running:
```bash
npm run dev
```

### Connection refused
Check if the `baseUrl` is correct and the server is accessible.

### Tests failing
1. Check server logs for errors
2. Verify database is properly set up
3. Ensure test data is clean (run migrations if needed)

## 📝 Writing New Tests

To add new tests to the collection:

1. Import `api-tests.postman_collection.json` into Postman
2. Add new requests to appropriate folders
3. Add test scripts in the "Tests" tab
4. Export the collection back to the file

Example test script:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
});
```

## 🔗 Resources

- [Newman Documentation](https://learning.postman.com/docs/running-collections/using-newman-cli/command-line-integration-with-newman/)
- [Postman Test Scripts](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [Chai Assertion Library](https://www.chaijs.com/api/bdd/)
