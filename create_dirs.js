const fs = require('fs');
const paths = [
  'p:\\EduSense AI\\backend\\config',
  'p:\\EduSense AI\\firebase',
  'p:\\EduSense AI\\frontend\\src\\utils'
];
paths.forEach(d => fs.mkdirSync(d, {recursive: true}));
console.log('Done');
