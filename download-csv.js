import 'dotenv/config';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = process.env.DB_DOWNLOAD_URL;
const dest = path.join(__dirname, 'EvaliuateReport.csv');

if (!url) {
  console.error('Error: csv is not defined in .env');
  process.exit(1);
}

const file = fs.createWriteStream(dest);

console.log(`Downloading csv from: ${url}...`);

https.get(url, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download: Status Code ${response.statusCode}`);
    file.close();
    fs.unlink(dest, () => {}); 
    return;
  }

  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('✅ Download complete: EvaliuateReport.csv is in the root directory.');
  });
}).on('error', (err) => {
  fs.unlink(dest, () => {});
  console.error(`❌ Error: ${err.message}`);
});