import re

with open('src/pages/ProfilePage.jsx', 'r') as f:
    text = f.read()

text = text.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport AddressBook from '../components/AddressBook';")

text = text.replace(
    "<Button variant=\"secondary\" size=\"sm\" icon={Edit3}>Edit Profile</Button>",
    "<Button variant=\"secondary\" size=\"sm\" icon={Edit3} onClick={() => alert('Profile editing coming soon')}>Edit Profile</Button>"
)

text = text.replace(
    "                <div className=\"mt-6 pt-6 border-t border-border\">\n                  <div className=\"flex items-center gap-2 text-sm text-text-secondary\">\n                    <Shield size={16} />\n                    <span>Your data is encrypted and secure</span>\n                  </div>\n                </div>\n              </div>\n            )}",
    "                <div className=\"mt-6 pt-6 border-t border-border\">\n                  <div className=\"flex items-center gap-2 text-sm text-text-secondary\">\n                    <Shield size={16} />\n                    <span>Your data is encrypted and secure</span>\n                  </div>\n                </div>\n              </div>\n            )}\n            {activeTab === 'addresses' && (\n              <AddressBook />\n            )}"
)

with open('src/pages/ProfilePage.jsx', 'w') as f:
    f.write(text)

