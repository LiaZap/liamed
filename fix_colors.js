import fs from 'fs';

let file1 = 'src/components/diagnosis/ConsultationDetailsModal.tsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(/bg-purple-100 dark:bg-purple-900\/30/g, 'bg-teal-100 dark:bg-teal-900/30');
content1 = content1.replace(/text-purple-600 dark:text-purple-400/g, 'text-teal-600 dark:text-teal-400');
fs.writeFileSync(file1, content1, 'utf8');

console.log('Fixed ConsultationDetailsModal colors');
