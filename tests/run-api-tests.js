#!/usr/bin/env node

/**
 * API Test Runner
 * Automated testing script for ITAM APIs using Newman
 * 
 * Usage:
 *   npm run test:api
 *   node tests/run-api-tests.js
 */

const newman = require('newman');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
    collection: path.join(__dirname, 'api-tests.postman_collection.json'),
    environment: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000'
    },
    reporters: ['cli', 'json', 'html'],
    reporter: {
        html: {
            export: path.join(__dirname, 'results', 'api-test-report.html')
        },
        json: {
            export: path.join(__dirname, 'results', 'api-test-results.json')
        }
    }
};

// Ensure results directory exists
const resultsDir = path.join(__dirname, 'results');
if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
}

console.log('🚀 Starting API Tests...\n');
console.log(`📍 Base URL: ${config.environment.baseUrl}`);
console.log(`📦 Collection: ${path.basename(config.collection)}\n`);

// Run Newman
newman.run({
    collection: require(config.collection),
    environment: {
        values: [
            { key: 'baseUrl', value: config.environment.baseUrl, type: 'default' }
        ]
    },
    reporters: config.reporters,
    reporter: config.reporter,
    insecure: true, // Allow self-signed certificates in dev
    timeout: 30000, // 30 seconds timeout
    timeoutRequest: 10000, // 10 seconds per request
    delayRequest: 100, // 100ms delay between requests
}, function (err, summary) {
    if (err) {
        console.error('❌ Test run failed:', err);
        process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));

    const stats = summary.run.stats;
    const failures = summary.run.failures;

    console.log(`\n✅ Total Requests: ${stats.requests.total}`);
    console.log(`✅ Passed: ${stats.assertions.total - stats.assertions.failed}`);
    console.log(`❌ Failed: ${stats.assertions.failed}`);
    console.log(`⏱️  Average Response Time: ${Math.round(summary.run.timings.responseAverage)}ms`);

    if (failures.length > 0) {
        console.log('\n❌ Failed Tests:');
        failures.forEach((failure, index) => {
            console.log(`\n${index + 1}. ${failure.error.name}`);
            console.log(`   Request: ${failure.source.name || 'Unknown'}`);
            console.log(`   Message: ${failure.error.message}`);
        });
    }

    console.log('\n📄 Reports generated:');
    console.log(`   HTML: ${config.reporter.html.export}`);
    console.log(`   JSON: ${config.reporter.json.export}`);

    console.log('\n' + '='.repeat(60) + '\n');

    // Exit with error code if tests failed
    process.exit(stats.assertions.failed > 0 ? 1 : 0);
});
