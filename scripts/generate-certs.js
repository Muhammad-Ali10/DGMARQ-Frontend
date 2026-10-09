import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const keyPath = path.join(projectRoot, 'localhost-key.pem');
const certPath = path.join(projectRoot, 'localhost.pem');

try {
  execSync('openssl version', { stdio: 'ignore' });
} catch {
  console.error('❌ OpenSSL is not installed or not in PATH.');
  console.error('   Please install OpenSSL to generate certificates.');
  console.error('   Windows: Download from https://slproweb.com/products/Win32OpenSSL.html');
  console.error('   macOS: brew install openssl');
  console.error('   Linux: sudo apt-get install openssl');
  process.exit(1);
}

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('⚠️  Certificates already exist.');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('   Delete them first if you want to regenerate.');
  process.exit(0);
}

console.log('🔐 Generating self-signed SSL certificates for local HTTPS...');
console.log('   This is required for PayPal CardFields to work properly.\n');

try {
  console.log('📝 Generating private key...');
  execSync(
    `openssl genrsa -out "${keyPath}" 2048`,
    { stdio: 'inherit', cwd: projectRoot }
  );

  console.log('📝 Generating certificate...');
  execSync(
    `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`,
    { stdio: 'inherit', cwd: projectRoot }
  );

  console.log('\n✅ Certificates generated successfully!');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('\n📌 Next steps:');
  console.log('   1. Restart your dev server: npm run dev');
  console.log('   2. Access your app at: https://localhost:5173');
  console.log('   3. Accept the browser security warning (self-signed certificate)');
  console.log('   4. PayPal CardFields should now work properly!\n');
} catch (error) {
  console.error('\n❌ Failed to generate certificates:', error.message);
  process.exit(1);
}
