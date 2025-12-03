# Database Import/Export Tools

## 📁 Files in this directory:

1. **schema.sql** - Complete database schema
2. **migration.sql** - Migration script to update existing database
3. **run-migration.js** - Node.js script to run migrations
4. **import-csv.js** - CSV import tool
5. **sample-import.csv** - Sample CSV template

---

## 🚀 Usage

### 1. Update Database Schema

To add missing columns to your existing database:

```bash
node database/run-migration.js
```

### 2. Import CSV Data

To import assets from a CSV file:

```bash
# Install csv-parser if not already installed
npm install csv-parser

# Import from your CSV file
node database/import-csv.js path/to/your/file.csv

# Example:
node database/import-csv.js ./database/sample-import.csv
node database/import-csv.js C:/Users/Admin/Desktop/assets.csv
```

### 3. CSV File Format

Your CSV file must have these column headers (in any order):

**Required columns:**
- `asset_tag` - Unique asset identifier
- `type` - Asset type (laptop, desktop, router, switch, etc.)
- `manufacturer` - Manufacturer name
- `model` - Model name
- `serialnumber` - Serial number

**Optional columns:**
- `purchasedate` - Purchase date (YYYY-MM-DD)
- `purchaseprice` - Purchase price (number)
- `supplier` - Supplier name
- `warrantyexpiry` - Warranty expiry date (YYYY-MM-DD)
- `assigneduser` - Assigned user name
- `location` - Location
- `department` - Department
- `building` - Building/Factory name
- `division` - Division
- `section` - Section
- `area` - Area/Zone
- `pc_name` - PC/Computer name
- `status` - Status (available, assigned, maintenance, retired)
- `condition` - Condition (new, good, fair, poor, broken)
- `operatingsystem` - Operating system
- `os_version` - OS version
- `os_key` - OS license key
- `ms_office_apps` - MS Office apps (semicolon separated)
- `ms_office_version` - MS Office version
- `is_legally_purchased` - Legal purchase status (yes/no/unknown)
- `processor` - CPU/Processor
- `memory` - RAM
- `storage` - Storage capacity
- `hostname` - Network hostname
- `ipaddress` - IP address
- `macaddress` - MAC address
- `patchstatus` - Patch status (up-to-date, needs-review, pending)
- `lastpatch_check` - Last patch check date (YYYY-MM-DD)
- `isloanable` - Is loanable (true/false)
- `description` - Description
- `notes` - Additional notes

---

## 📝 Notes

1. **Duplicate handling**: If an asset with the same `asset_tag` already exists, it will be updated with the new data.

2. **Empty values**: Empty cells in the CSV will be skipped (won't overwrite existing data).

3. **Date format**: Use `YYYY-MM-DD` format for dates (e.g., `2024-12-02`).

4. **Boolean values**: Use `true` or `false` for boolean fields like `isloanable`.

5. **Encoding**: CSV file should be UTF-8 encoded.

---

## 🔧 Troubleshooting

### Error: "File not found"
- Check the file path is correct
- Use absolute path if relative path doesn't work
- On Windows, use forward slashes or escape backslashes

### Error: "column does not exist"
- Run the migration first: `node database/run-migration.js`
- Check your CSV headers match the column names exactly

### Error: "duplicate key value"
- The `asset_tag` or `serialnumber` already exists
- Either update the existing record or use a different tag

---

## 💡 Tips

1. **Test with sample data first**: Use `sample-import.csv` to test the import process

2. **Backup before import**: Always backup your database before importing large datasets

3. **Check the summary**: The import script shows a summary with success/error counts

4. **Review errors**: If there are errors, they will be displayed at the end

---

## 🔗 Direct PostgreSQL Import (Advanced)

If you prefer to use PostgreSQL's native COPY command:

1. Connect to PostgreSQL using psql:
```bash
psql -h localhost -U rootpg -d asset_management
```

2. Run the COPY command:
```sql
\copy assets(asset_tag, type, manufacturer, model, serialnumber, purchasedate, purchaseprice, supplier, warrantyexpiry, assigneduser, location, department, building, division, section, area, pc_name, status, condition, operatingsystem, os_version, os_key, ms_office_apps, ms_office_version, is_legally_purchased, processor, memory, storage, hostname, ipaddress, macaddress, patchstatus, lastpatch_check, isloanable, description, notes) FROM 'C:/path/to/file.csv' WITH (FORMAT csv, DELIMITER ',', HEADER, ENCODING 'UTF8');
```

**Note**: On Windows, use forward slashes in the path or escape backslashes.
