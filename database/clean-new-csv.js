const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'Software-Inventory_Dec.csv');
const outputFile = path.join(__dirname, 'Software-Inventory_Dec_Cleaned.csv');

console.log('🧹 Cleaning CSV file...');

try {
    const content = fs.readFileSync(inputFile, 'utf8');

    // 1. Parse the CSV manually
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;

            currentRow.push(currentField.trim());
            if (currentRow.some(f => f !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentField = '';
        } else {
            if (char === '\n' || char === '\r') {
                currentField += ' ';
            } else {
                currentField += char;
            }
        }
    }

    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    console.log(`📊 Parsed ${rows.length} raw rows.`);

    // 2. Find header
    let headerIndex = -1;
    for (let i = 0; i < rows.length; i++) {
        const rowStr = rows[i].join(',').toLowerCase();
        if (rowStr.includes('division') && rowStr.includes('section')) {
            headerIndex = i;
            break;
        }
    }

    if (headerIndex === -1) headerIndex = 1;
    console.log(`📍 Header found at index ${headerIndex}`);

    // 3. Extract data rows
    const dataRows = rows.slice(headerIndex + 1).filter(row => {
        const pcName = row[5];
        return row.length > 5 && (pcName || row[1]);
    });

    // 4. Define new clean header
    const newHeader = [
        'id',
        'building_or_factory',
        'division',
        'section',
        'area',
        'pc_name',
        'pc_type',
        'manufacturer', // Split from Maker & Model
        'model',        // Split from Maker & Model
        'serial_number_cpu',
        'user_owner',
        'os_use',
        'license_free',
        'window_license',
        'os_license',
        'ms_office',
        'version',
        'legally_purchase',
        'refer_document',
        // New Technical Specs
        'processor',
        'memory',
        'storage',
        // New Network Config
        'ip_address',
        'mac_address',
        'hostname'
    ];

    // Helper to split Maker & Model
    function splitMakerModel(makerModelStr) {
        if (!makerModelStr || makerModelStr === '-') return { maker: '', model: '' };

        // Simple heuristic: First word is maker, rest is model
        // Unless it's a known pattern
        const parts = makerModelStr.split(' ');
        if (parts.length === 1) return { maker: parts[0], model: '' };

        const maker = parts[0];
        const model = parts.slice(1).join(' ');
        return { maker, model };
    }

    // 5. Map data to new header structure
    const cleanRows = dataRows.map((row, index) => {
        // Original CSV Structure based on observation:
        // 0: id (or empty)
        // 1: Building
        // 2: Division
        // 3: Section
        // 4: Area
        // 5: PC Name
        // 6: PC Type
        // 7: Maker & Model  <-- Need to split this
        // 8: Serial Number
        // 9: User Owner
        // 10: OS Use
        // 11: License/Free
        // 12: Window License
        // 13: OS License
        // 14: MS Office
        // 15: Version
        // 16: Legally Purchase
        // 17: Refer Document

        const makerModelStr = row[7] || '';
        const { maker, model } = splitMakerModel(makerModelStr);

        const newRow = [
            row[0] || (index + 1).toString(), // id
            row[1] || '', // building
            row[2] || '', // division
            row[3] || '', // section
            row[4] || '', // area
            row[5] || '', // pc_name
            row[6] || '', // pc_type
            maker,        // manufacturer
            model,        // model
            row[8] || '', // serial_number
            row[9] || '', // user_owner
            row[10] || '', // os_use
            row[11] || '', // license_free
            row[12] || '', // window_license
            row[13] || '', // os_license
            row[14] || '', // ms_office
            row[15] || '', // version
            row[16] || '', // legally_purchase
            row[17] || '', // refer_document
            '', // processor (empty)
            '', // memory (empty)
            '', // storage (empty)
            '', // ip_address (empty)
            '', // mac_address (empty)
            ''  // hostname (empty)
        ];

        return newRow.map(cell => {
            if (cell.includes(',') || cell.includes('"')) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        });
    });

    // 6. Write to file
    const csvContent = [
        newHeader.join(','),
        ...cleanRows.map(r => r.join(','))
    ].join('\n');

    fs.writeFileSync(outputFile, csvContent);
    console.log(`✅ Cleaned CSV saved to ${outputFile}`);
    console.log(`📝 Total data rows: ${cleanRows.length}`);

} catch (err) {
    console.error('❌ Error:', err);
}
