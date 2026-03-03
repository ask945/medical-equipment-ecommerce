const fs = require('fs');

function updateComponents() {
  const headerPath = 'src/components/Header.jsx';
  if (fs.existsSync(import.meta.url ? path.resolve('./src/components/Header.jsx') : headerPath)) {
    let headerStr = fs.readFileSync(headerPath, 'utf8');
    // We already replaced in header if Box exists, if not, update Header.
    if (!headerStr.includes('<Box') && headerStr.includes("toUpperCase()")) {
       headerStr = headerStr.replace(
         /\{\(cat\.label \|\| cat\.name \|\| 'C'\)\[0\]\.toUpperCase\(\)\}/g,
         "<span className=\"font-bold\">-</span>"
       );
       fs.writeFileSync(headerPath, headerStr);
    }
  }

  const hpPath = 'src/pages/HomePage.jsx';
  if (fs.existsSync(hpPath)) {
    let hpStr = fs.readFileSync(hpPath, 'utf8');
    // Ensure "Shop by Category" only shows 3, then a 4th valid block.
    // wait I'll update HomePage reactatively using multiple line.
  }
}
updateComponents();
