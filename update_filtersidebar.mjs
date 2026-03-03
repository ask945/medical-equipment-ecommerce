import fs from 'fs';

let content = fs.readFileSync('src/components/FilterSidebar.jsx', 'utf8');

const targetStr = `  const categories = ['Diabetes Care', 'Respiratory & CPAP', 'Heart & BP Monitors', 'Mobility & Recovery'];`;

const replacementStr = `  const [categories, setCategories] = useState([]);

  useEffect(() => {
    import('../services/categoryService.js').then(({ getCategories }) => {
      getCategories().then((data) => {
        setCategories(data.map(cat => cat.label || cat.name));
      }).catch(console.error);
    });
  }, []);`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/FilterSidebar.jsx', content);
