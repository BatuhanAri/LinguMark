import fs from 'fs';
import path from 'path';

const distPath = path.resolve('dist');
const htmlFiles = ['index.html', 'dashboard.html'];

htmlFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Remove crossorigin attribute
    content = content.replace(/ crossorigin/g, '');
    // Ensure relative paths
    content = content.replace(/href="\//g, 'href="./');
    content = content.replace(/src="\//g, 'src="./');
    fs.writeFileSync(filePath, content);
    console.log(`Cleaned ${file}`);
  }
});
