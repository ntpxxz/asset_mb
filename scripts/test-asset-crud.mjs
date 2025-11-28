#!/usr/bin/env node

/**
 * Asset CRUD Test Script
 * ทดสอบการทำงานของ API สำหรับ Create, Read, Update, Delete assets
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3091';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bright: '\x1b[1m',
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

const testData = {
    type: 'pc',
    manufacturer: 'Lenovo',
    model: 'Test-M720',
    serialnumber: `TEST-${Date.now()}`,
    purchasedate: '2024-01-15',
    purchaseprice: 25000,
    status: 'available',
    building: 'Test Building',
    division: 'Test Division',
    section: 'Test Section',
    area: 'CALL_01',
    pc_name: 'PC-TEST-001',
    operatingsystem: 'Win10',
    os_version: 'Win10',
    os_key: 'TEST-KEY',
    ms_office_apps: 'Excel,Word',
    ms_office_version: '2019',
    is_legally_purchased: 'yes',
    processor: 'i5',
    memory: '16GB',
    storage: '512GB',
};

let createdId = null;

async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    log(`→ ${options.method || 'GET'} ${url}`, 'cyan');

    try {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = { error: 'Invalid JSON', body: text.substring(0, 200) };
        }

        log(`← ${res.status} ${res.statusText}`, res.ok ? 'green' : 'red');
        return { ok: res.ok, status: res.status, data };
    } catch (err) {
        log(`✗ ${err.message}`, 'red');
        return { ok: false, status: 0, data: { error: err.message } };
    }
}

async function testCRUD() {
    log('\n🧪 Asset CRUD Test\n', 'bright');

    // CREATE
    log('═══ TEST 1: CREATE ═══', 'bright');
    const createRes = await apiCall('/api/assets', {
        method: 'POST',
        body: JSON.stringify(testData),
    });

    if (createRes.ok && createRes.data.success) {
        createdId = createRes.data.data?.id || createRes.data.data?.asset_tag;
        log(`✓ Created: ${createdId}`, 'green');
    } else {
        log(`✗ Failed:`, 'red');
        console.log(JSON.stringify(createRes.data, null, 2));
    }

    await new Promise(r => setTimeout(r, 500));

    // READ
    if (createdId) {
        log('\n═══ TEST 2: READ ═══', 'bright');
        const readRes = await apiCall(`/api/assets/${createdId}`);

        if (readRes.ok && readRes.data.success) {
            log(`✓ Read success`, 'green');
            const asset = readRes.data.data;
            log(`  pc_name: ${asset.pc_name}`, 'cyan');
            log(`  area: ${asset.area}`, 'cyan');
        } else {
            log(`✗ Failed`, 'red');
            console.log(readRes.data);
        }
    }

    await new Promise(r => setTimeout(r, 500));

    // UPDATE
    if (createdId) {
        log('\n═══ TEST 3: UPDATE ═══', 'bright');
        const updateRes = await apiCall(`/api/assets/${createdId}`, {
            method: 'PUT',
            body: JSON.stringify({ area: 'CALL_02', notes: 'Updated' }),
        });

        if (updateRes.ok && updateRes.data.success) {
            log(`✓ Updated`, 'green');
        } else {
            log(`✗ Failed`, 'red');
            console.log(updateRes.data);
        }
    }

    await new Promise(r => setTimeout(r, 500));

    // DELETE
    if (createdId) {
        log('\n═══ TEST 4: DELETE ═══', 'bright');
        const deleteRes = await apiCall(`/api/assets/${createdId}`, {
            method: 'DELETE',
        });

        if (deleteRes.ok && deleteRes.data.success) {
            log(`✓ Deleted`, 'green');
        } else {
            log(`✗ Failed`, 'red');
            console.log(deleteRes.data);
        }
    }

    log('\n✅ Test Complete\n', 'bright');
}

testCRUD();
