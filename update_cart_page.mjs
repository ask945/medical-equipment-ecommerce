import fs from 'fs';

let text = fs.readFileSync('src/pages/CartPage.jsx', 'utf8');
if (!text.includes('useCart')) {
  text = text.replace(
    "import Button from '../components/Button';",
    "import Button from '../components/Button';\nimport { useCart } from '../context/CartContext';"
  );
}

text = text.replace(
  "  const [items, setItems] = useState([]);\n  const [promoCode, setPromoCode] = useState('');\n\n  const updateQuantity = (id, delta) => {\n    setItems((prev) =>\n      prev.map((item) =>\n        item.id === id\n          ? { ...item, quantity: Math.max(1, item.quantity + delta) }\n          : item\n      )\n    );\n  };\n\n  const removeItem = (id) => {\n    setItems((prev) => prev.filter((item) => item.id !== id));\n  };\n\n  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);",
  "  const { cartItems: items, updateQuantity, removeFromCart, subtotal, loading } = useCart();\n  const [promoCode, setPromoCode] = useState('');\n\n  const updateQty = (id, delta) => {\n    updateQuantity(id, (current) => current + delta);\n  };\n\n  const removeItem = (id) => {\n    removeFromCart(id);\n  };\n"
);
text = text.replace(
  /onClick\(\) => updateQuantity\(/g,
  "onClick={() => updateQty("
);
text = text.replace(/updateQuantity\(/g, "updateQty(");
// Fix the destructuring definition!
text = text.replace("const { cartItems: items, updateQty", "const { cartItems: items, updateQuantity");

fs.writeFileSync('src/pages/CartPage.jsx', text);
