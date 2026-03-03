import re

with open('src/components/FilterSidebar.jsx', 'r') as f:
    text = f.read()

# Fix duplicates injected multiple times!
# Remove earlier categories injections
if "const [categories, setCategories]=useState([]);" in text:
    lines = text.split('\n')
    filtered = []
    skip = False
    for line in lines:
        if "const [categories, setCategories]=useState([]);" in line:
            skip = True
        elif skip and "getBrands()" in line:
            skip = False
            filtered.append(line)
        elif not skip:
            filtered.append(line)
    text = '\n'.join(filtered)

# We want categories dynamically replacing the hardcoded list
target = "const categories = ['Diabetes Care', 'Respiratory & CPAP', 'Heart & BP Monitors', 'Mobility & Recovery'];"
replacement = """  const [categories, setCategories] = useState([]);

  useEffect(() => {
    import('../services/categoryService.js').then(({ getCategories }) => {
      getCategories().then((data) => {
        setCategories(data.map(cat => cat.label || cat.name));
      }).catch(console.error);
    });
  }, []);"""
  
if target in text:
    text = text.replace(target, replacement)

with open('src/components/FilterSidebar.jsx', 'w') as f:
    f.write(text)

