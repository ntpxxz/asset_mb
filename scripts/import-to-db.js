const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importAssets() {
    const csvPath = path.join(__dirname, '../database/assets (6).csv');
    const csvContent = fs.readFileSync(csvPath, 'latin1');

    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');

    console.log(`Found ${lines.length} records to import`);

    const assets = lines.map((line, index) => {
        // Simple CSV parsing handling quoted fields
        const parts = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                parts.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current.trim());

        const clean = (val) => val === '-' ? '' : val.replace(/^"|"$/g, '');

        return {
            asset_tag: clean(parts[5]) || `UNKNOWN-${clean(parts[0])}`,
            type: (clean(parts[6]) || 'computer').toLowerCase(),
            manufacturer: 'Unknown',
            model: clean(parts[7]) || 'Unknown',
            serialnumber: clean(parts[8]) || 'Unknown',
            purchasedate: clean(parts[11]) || null,
            purchaseprice: null,
            supplier: '',
            warrantyexpiry: null,
            assigneduser: clean(parts[9]),
            location: clean(parts[4]),
            department: clean(parts[2]),
            status: 'in-use',
            operatingsystem: clean(parts[10]),
            processor: '',
            memory: '',
            storage: '',
            hostname: clean(parts[5]),
            ipaddress: '',
            macaddress: '',
            patchstatus: 'needs-review',
            lastpatch_check: null,
            isloanable: clean(parts[16]) === 'Yes',
            condition: 'good',
            description: `Imported from CSV. Division: ${clean(parts[1])}, Section: ${clean(parts[3])}`,
            notes: '',
            building: '',
            division: clean(parts[1]),
            section: clean(parts[3]),
            area: clean(parts[4]),
            pc_name: clean(parts[5]),
            os_key: clean(parts[12]),
            os_version: clean(parts[13]),
            ms_office_apps: clean(parts[14]),
            ms_office_version: clean(parts[15]),
            is_legally_purchased: clean(parts[11]),
        };
    });

    console.log('Starting database import...');

    // Clear existing assets
    await prisma.asset.deleteMany({});
    console.log('Cleared existing assets');

    // Import in batches to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < assets.length; i += batchSize) {
        const batch = assets.slice(i, i + batchSize);
        await prisma.asset.createMany({
            data: batch,
            skipDuplicates: true,
        });
        console.log(`Imported ${Math.min(i + batchSize, assets.length)} / ${assets.length} assets`);
    }

    console.log('Import completed successfully!');
}

async function main() {
    try {
        await importAssets();
    } catch (error) {
        console.error('Error importing assets:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
