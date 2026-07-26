const bcrypt = require('bcrypt');
const password = 'Pranee@1909';
bcrypt.hash(password, 12).then(hash => {
  console.log('HASH:', hash);
  // Verify it works
  bcrypt.compare(password, hash).then(ok => {
    console.log('Verify:', ok);
  });
});
