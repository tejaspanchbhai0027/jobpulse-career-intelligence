const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testUpload() {
  try {
    const resReg = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test Upload User',
      email: `testup${Date.now()}@example.com`,
      password: 'password123'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const cookies = resReg.headers['set-cookie'];
    
    // Create dummy PDF
    const dummyPdfPath = path.join(__dirname, 'dummy.pdf');
    fs.writeFileSync(dummyPdfPath, '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n');

    const form = new FormData();
    form.append('resume', fs.createReadStream(dummyPdfPath));
    form.append('name', 'My Dummy Resume');

    const headers = { ...form.getHeaders(), 'Cookie': cookies[0] };
    
    const resUpload = await axios.post('http://localhost:5000/api/resumes', form, {
      headers
    });
    
    console.log('Upload Success:', resUpload.data);
    fs.unlinkSync(dummyPdfPath);
  } catch (err) {
    console.error('Upload Error Details:');
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

testUpload();
