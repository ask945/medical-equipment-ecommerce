import re

with open('src/pages/CheckoutPage.jsx', 'r') as f:
    checkout = f.read()

checkout = checkout.replace(
    "import Button from '../components/Button';",
    "import Button from '../components/Button';\nimport { useCart } from '../context/CartContext';"
)

checkout = checkout.replace(
    "const [cartItems] = useState([]); // Cart will be managed via context/state in future",
    "const { cartItems, subtotal } = useCart();"
)

checkout = checkout.replace(
    "const subtotal = cartItems.reduce((s, item) => s + item.price * item.quantity, 0);\n",
    ""
)

with open('src/pages/CheckoutPage.jsx', 'w') as f:
    f.write(checkout)

with open('src/pages/CartPage.jsx', 'r') as f:
    cart = f.read()

cart = cart.replace(
    "import Button from '../components/Button';",
    "import Button from '../components/Button';\nimport { useCart } from '../context/CartContext';"
)

target = """  const [items, setItems] = useState([]);
  const [promoCode, setPromoCode] = useState('');

  const updateQuantity = (id, delta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);"""

replacement = """  const { cartItems: items, updateQuantity: contextUpdateQty, removeFromCart, subtotal, loading } = useCart();
  const [promoCode, setPromoCode] = useState('');

  const updateQuantity = (id, delta) => {
    contextUpdateQty(id, (current) => Math.max(1, current + delta));
  };

  const removeItem = (id) => {
    removeFromCart(id);
  };"""

cart = cart.replace(target, replacement)

with open('src/pages/CartPage.jsx', 'w') as f:
    f.write(cart)

