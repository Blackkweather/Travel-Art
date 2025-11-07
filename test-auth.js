const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testAuth() {
  console.log('🧪 Testing Travel Art Authentication...\n');

  try {
    // Test health check first
    console.log('1. Testing health check...');
    const healthResponse = await axios.get('http://localhost:4000/health');
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Test registration
    console.log('2. Testing registration...');
    const registerData = {
      role: 'ARTIST',
      name: 'Test Artist',
      email: 'test@example.com',
      password: 'testpassword123',
      phone: '+1234567890',
      locale: 'en'
    };

    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
      console.log('✅ Registration successful:', {
        success: registerResponse.data.success,
        userId: registerResponse.data.data.user.id,
        role: registerResponse.data.data.user.role,
        hasToken: !!registerResponse.data.data.token
      });
      console.log('');

      // Test login with the same credentials
      console.log('3. Testing login...');
      const loginData = {
        email: 'test@example.com',
        password: 'testpassword123'
      };

      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
      console.log('✅ Login successful:', {
        success: loginResponse.data.success,
        userId: loginResponse.data.data.user.id,
        role: loginResponse.data.data.user.role,
        hasToken: !!loginResponse.data.data.token
      });

      // Test authenticated endpoint
      console.log('');
      console.log('4. Testing authenticated endpoint...');
      const token = loginResponse.data.data.token;
      const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Authenticated request successful:', {
        success: meResponse.data.success,
        userEmail: meResponse.data.data.user.email,
        userName: meResponse.data.data.user.name
      });

    } catch (registerError) {
      if (registerError.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ User already exists, testing login directly...');
        
        // Test login with existing user
        const loginData = {
          email: 'test@example.com',
          password: 'testpassword123'
        };

        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
        console.log('✅ Login successful:', {
          success: loginResponse.data.success,
          userId: loginResponse.data.data.user.id,
          role: loginResponse.data.data.user.role,
          hasToken: !!loginResponse.data.data.token
        });
      } else {
        throw registerError;
      }
    }

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the server running on port 4000?');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testAuth();