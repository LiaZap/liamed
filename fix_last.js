import fs from 'fs';

let file1 = 'src/components/users/EditUserModal.tsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace('console.error("Failed to fetch resources", error);', 'console.error("Failed to fetch resources");');
fs.writeFileSync(file1, content1, 'utf8');
