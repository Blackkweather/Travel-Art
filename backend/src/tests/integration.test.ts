/**
 * API Integration Tests
 * Tests all major endpoints to ensure data is flowing correctly
 */

import axios from 'axios'

const BASE_URL = 'http://localhost:4000/api';

// Simple exit wrapper that uses Node's process global
const exitTest = (code: number) => {
  setTimeout(() => {
    // @ts-ignore - process is a Node global
    if (typeof process !== 'undefined' && process.exit) {
      // @ts-ignore
      process.exit(code)
    }
  }, 100)
}

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  duration: number;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<any>) {
  const start = Date.now();
  try {
    const data = await fn();
    const duration = Date.now() - start;
    results.push({ name, status: 'pass', duration, data });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({ name, status: 'fail', duration, error: errorMsg });
    console.error(`❌ ${name} (${duration}ms) - ${errorMsg}`);
  }
}

async function runTests() {
  console.log('\n🧪 Running API Integration Tests...\n');

  // Test 1: Health Check
  await test('Health Check', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    if (!response.data || response.status !== 200) {
      throw new Error('Health check failed');
    }
    return response.data;
  });

  // Test 2: Get Top Artists
  await test('Get Top Artists', async () => {
    const response = await axios.get(`${BASE_URL}/top?type=artists`);
    if (!response.data?.success && !Array.isArray(response.data)) {
      throw new Error('Invalid artists response format');
    }
    const artists = response.data.data || response.data;
    if (!Array.isArray(artists)) {
      throw new Error('Artists data is not an array');
    }
    return artists;
  });

  // Test 3: Get Top Hotels
  await test('Get Top Hotels', async () => {
    const response = await axios.get(`${BASE_URL}/top?type=hotels`);
    if (!response.data?.success && !Array.isArray(response.data)) {
      throw new Error('Invalid hotels response format');
    }
    const hotels = response.data.data || response.data;
    if (!Array.isArray(hotels)) {
      throw new Error('Hotels data is not an array');
    }
    return hotels;
  });

  // Test 4: Get Trips
  await test('Get Published Trips', async () => {
    const response = await axios.get(`${BASE_URL}/trips`);
    if (!response.data?.success && !Array.isArray(response.data)) {
      throw new Error('Invalid trips response format');
    }
    const trips = response.data.data || response.data;
    if (!Array.isArray(trips)) {
      throw new Error('Trips data is not an array');
    }
    return trips;
  });

  // Test 5: Get Trips with status filter
  await test('Get Trips with Status Filter', async () => {
    const response = await axios.get(`${BASE_URL}/trips?status=PUBLISHED`);
    if (!response.data?.success && !Array.isArray(response.data)) {
      throw new Error('Invalid trips response format');
    }
    const trips = response.data.data || response.data;
    if (!Array.isArray(trips)) {
      throw new Error('Filtered trips data is not an array');
    }
    return trips;
  });

  // Test 6: Validate Artist Structure
  await test('Validate Artist Data Structure', async () => {
    const response = await axios.get(`${BASE_URL}/top?type=artists`);
    const artists = response.data.data || response.data;
    if (artists.length === 0) {
      throw new Error('No artists found');
    }
    const artist = artists[0];
    const required = ['id', 'name'];
    for (const field of required) {
      if (!(field in artist)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return artist;
  });

  // Test 7: Validate Hotel Structure
  await test('Validate Hotel Data Structure', async () => {
    const response = await axios.get(`${BASE_URL}/top?type=hotels`);
    const hotels = response.data.data || response.data;
    if (hotels.length === 0) {
      throw new Error('No hotels found');
    }
    const hotel = hotels[0];
    const required = ['id', 'name'];
    for (const field of required) {
      if (!(field in hotel)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return hotel;
  });

  // Test 8: Validate Trip Structure
  await test('Validate Trip Data Structure', async () => {
    const response = await axios.get(`${BASE_URL}/trips`);
    const trips = response.data.data || response.data;
    if (trips.length === 0) {
      throw new Error('No trips found');
    }
    const trip = trips[0];
    const required = ['id', 'title'];
    for (const field of required) {
      if (!(field in trip)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return trip;
  });

  // Print results summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;
  const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / total);

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️ Average Duration: ${avgDuration}ms`);

  if (failed > 0) {
    console.log('\n⚠️ Failed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(50) + '\n');

  exitTest(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  exitTest(1);
});
