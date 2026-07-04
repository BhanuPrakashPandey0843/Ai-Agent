
const themeContext = require('./src/context/ThemeContext');
const colorsModule = require('./src/theme/colors');
console.log('✅ colorsModule has Spacing:', 'Spacing' in colorsModule, colorsModule.Spacing);
console.log('✅ themeContext keys:', Object.keys(themeContext));
