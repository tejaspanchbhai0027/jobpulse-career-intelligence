const fs = require('fs');
let code = fs.readFileSync('server/tests/api.test.js', 'utf8');
code = code.replace(/\.set\('Authorization', `Bearer \$\{token\}`\)/g, ".set('Cookie', cookie)");
code = code.replace(/\.set\('Authorization', `Bearer \$\{token2\}`\)/g, ".set('Cookie', cookie2)");
code = code.replace(/\{ token \}/g, '{ cookie }');
fs.writeFileSync('server/tests/api.test.js', code);
console.log('Fixed API test');
