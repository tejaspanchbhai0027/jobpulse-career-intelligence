const axios = require('axios');
const http = require('http');

async function testCopilot() {
  try {
    // First we need a valid token. Let's register a temporary user or login.
    const resReg = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const cookies = resReg.headers['set-cookie'];
    
    // Now call copilot
    const resCopilot = await axios.post('http://localhost:5000/api/ai/copilot', {
      message: 'Hello'
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies[0]
      }
    });
    
    console.log('Success:', resCopilot.data);
  } catch (err) {
    console.error('Error Details:');
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

testCopilot();
