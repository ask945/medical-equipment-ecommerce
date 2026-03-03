import fs from 'fs';

let text = fs.readFileSync('src/App.jsx', 'utf8');

if (!text.includes('useAuth')) {
    text = "import { useAuth } from './context/AuthContext';\n" + text;
}

if (!text.includes('if (loading)')) {
    text = text.replace(
        "const location = useLocation();\n",
        "const location = useLocation();\n  const { loading } = useAuth();\n\n  if (loading) {\n    return <div className=\"min-h-screen flex items-center justify-center\"><div className=\"animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent\"></div></div>;\n  }\n\n"
    );
}

fs.writeFileSync('src/App.jsx', text);
