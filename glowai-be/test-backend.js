const http = require('http');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (_) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (err) => { reject(err); });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testBackend() {
  const BASE_URL = 'http://localhost:3000/api';
  console.log('🧪 Starting GlowAI Backend Integration Tests...\n');

  const email = `test-${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  const name = 'Test User';

  let token = null;

  // 1. Register User
  try {
    console.log('⏳ Test 1: Registering a user...');
    const { status, data } = await request(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        skinType: 'Combination',
        age: 27
      })
    });
    
    if (status !== 201) {
      throw new Error(`Registration failed with status ${status}: ${JSON.stringify(data)}`);
    }
    console.log('✅ User registered successfully. Email:', email);
    token = data.token;
  } catch (err) {
    console.error('❌ Test 1 failed:', err.message);
    process.exit(1);
  }

  // 2. Login User
  try {
    console.log('\n⏳ Test 2: Logging in...');
    const { status, data } = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (status !== 200) {
      throw new Error(`Login failed with status ${status}: ${JSON.stringify(data)}`);
    }
    console.log('✅ Logged in successfully.');
    token = data.token;
  } catch (err) {
    console.error('❌ Test 2 failed:', err.message);
    process.exit(1);
  }

  // 3. Get profile
  try {
    console.log('\n⏳ Test 3: Fetching profile details...');
    const { status, data } = await request(`${BASE_URL}/user/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (status !== 200) {
      throw new Error(`Fetch profile failed with status ${status}: ${JSON.stringify(data)}`);
    }
    console.log('✅ Profile fetched successfully:', JSON.stringify(data.user));
  } catch (err) {
    console.error('❌ Test 3 failed:', err.message);
    process.exit(1);
  }

  // 4. Update profile
  try {
    console.log('\n⏳ Test 4: Updating profile details...');
    const { status, data } = await request(`${BASE_URL}/user/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        skinType: 'Oily',
        age: 30
      })
    });
    
    if (status !== 200) {
      throw new Error(`Update profile failed with status ${status}: ${JSON.stringify(data)}`);
    }
    console.log('✅ Profile updated successfully:', JSON.stringify(data.user));
  } catch (err) {
    console.error('❌ Test 4 failed:', err.message);
    process.exit(1);
  }

  console.log('\n🎉 All core auth & profile tests passed successfully!');
}

testBackend();
