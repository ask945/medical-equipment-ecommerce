const fs = require('fs');

let sidebar = fs.readFileSync('src/components/FilterSidebar.jsx', 'utf8');

sidebar = sidebar.replace(
  "const categories = ['Diabetes Care', 'Respiratory & CPAP', 'Heart & BP Monitors', 'Mobility & Recovery'];",
  "// Categories injected via DB"
);

fs.writeFileSync('src/components/FilterSidebar.jsx', sidebar);

let homepage = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');

// Replace standard category mapping with scaled view
homepage = homepage.replace(
  "{categories.map((cat) => (",
  "{categories.slice(0, 3).map((cat) => ("
);

// We find the closing div of category map layout to attach the View ALL block manually
if (!homepage.includes('bg-primary/5 hover:bg-primary/10')) {
    homepage = homepage.replace(
      "          </div>\n        </section>\n      )}",
      "            <Link to=\"/products\" className=\"group rounded-xl overflow-hidden h-56 border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-300 flex flex-col items-center justify-center p-6 text-center\">\n              <div className=\"w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300\">\n                <ArrowRight className=\"text-primary\" size={24} />\n              </div>\n              <h3 className=\"text-primary font-semibold text-lg\">View All Categories</h3>\n              <p className=\"text-primary/70 text-sm mt-1\">Explore our entire catalog</p>\n            </Link>\n          </div>\n        </section>\n      )}"
    );
}

fs.writeFileSync('src/pages/HomePage.jsx', homepage);

