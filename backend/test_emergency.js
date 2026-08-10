const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'hims-jwt-secret-key-2024-jio-hms-secure-token';

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Login as nexus
  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ type: 'nexus', email: 'admin@hims-sys.com', password: 'Admin@123' }));
  
  console.log('Login status:', loginRes.status);
  console.log('Login body:', JSON.stringify(loginRes.body, null, 2));
  
  if (loginRes.body.token) {
    const token = loginRes.body.token;
    
    // Try GET emergency triage
    const getRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/emergency/triage',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('\nGET emergency status:', getRes.status);
    console.log('GET emergency body:', JSON.stringify(getRes.body, null, 2));
    
    // Try POST emergency triage
    const postRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/emergency/triage',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
    }, JSON.stringify({
      patient_name: "Test Patient",
      mrn: "TEST001",
      age: 30,
      gender: "Male",
      esi_level: 3,
      chief_complaint: "Test complaint",
      bed_bay: "Bay 1",
      triage_nurse: "Test Nurse"
    }));
    console.log('\nPOST emergency status:', postRes.status);
    console.log('POST emergency body:', JSON.stringify(postRes.body, null, 2));
  }
}

main().catch(console.error);
