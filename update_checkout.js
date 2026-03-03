const fs = require('fs');

let pageContent = fs.readFileSync('src/pages/CheckoutPage.jsx', 'utf8');

if (!pageContent.includes('useCart')) {
  pageContent = pageContent.replace(
    "import Button from '../components/Button';",
    "import Button from '../components/Button';\nimport { useCart } from '../context/CartContext';"
  );
}

pageContent = pageContent.replace(
  "const [cartItems] = useState([]); // Cart will be managed via context/state in future",
  "const { cartItems, subtotal } = useCart();"
);

pageContent = pageContent.replace(
  "const subtotal = cartItems.reduce((s, item) => s + item.price * item.quantity, 0);",
  ""
);

fs.writeFileSync('src/pages/CheckoutPage.jsx', pageContent);

// Cart Page Updates
let cartContent = fs.readFileSync('src/pages/CartPage.jsx', 'utf8');
if (!cartContent.includes('useCart')) {
  cartContent = cartContent.replace(
    "import Button from '../components/Button';",
    "import Button from '../components/Button';\nimport { useCart } from '../context/CartContext';"
  );
}

// Remove static items handling logic
cartContent = cartContent.replace(
  "  const [items, setItems] = useState([]);\n  const [promoCode, setPromoCode] = useState('');\n\n  const updateQuantity = (id, delta) => {\n    setItems((prev) =>\n      prev.map((item) =>\n        item.id === id\n          ? { ...item, quantity: Math.max(1, item.quantity + delta) }\n          : item\n      )\n    );\n  };\n\n  const removeItem = (id) => {\n    setItems((prev) => prev.filter((item) => item.id !== id));\n  };\n\n  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);",
  "  const { cartItems: items, updateQuantity, removeFromCart, subtotal, loading } = useCart();\n  const [promoCode, setPromoCode] = useState('');\n\n  const updateQty = (id, delta) => {\n    updateQuantity(id, (current) => current + delta);\n  };\n\n  const removeItem = (id) => {\n    removeFromCart(id);\n  };\n"
);
cartContent = cartContent.replace(
  /updateQuantity\(/g,
  "updateQty("
);
cartContent = cartContent.replace(
  "const { cartItems: items, updateQty",
  "const { cartItems: items, updateQuantity"
);

fs.writeFileSync('src/pages/CartPage.jsx', cartContent);

