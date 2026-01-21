const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// Gets the password from the command line argument
const passwordToHash = process.argv[2];

if (!passwordToHash) {
    console.error('⚠️ Please provide the password to hash.');
    console.log('Usage: node hash-helper.js "your_password_here"');
    process.exit(1);
}

bcrypt.hash(passwordToHash, SALT_ROUNDS).then(hash => {
    console.log('✅ Your hashed password is:');
    console.log(hash);
});