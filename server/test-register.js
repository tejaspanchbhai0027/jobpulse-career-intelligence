const axios = require('axios');

async function testRegister() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test Student',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      institutionId: null,
      placementOfficerId: null,
      mentorId: null
    });
    console.log('Success:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('Error Response Status:', err.response.status);
      console.log('Error Response Data:', err.response.data);
    } else {
      console.log('Error:', err.message);
    }
  }
}

testRegister();
