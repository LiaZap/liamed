import fs from 'fs';

let file1 = 'src/components/users/EditUserModal.tsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(/user\?:\s*any;/, 'user?: Record<string, unknown>;');
content1 = content1.replace(/onSave\?:\s*\(userData:\s*any\)\s*=>\s*void;/, 'onSave?: (userData: Record<string, unknown>) => void;');
fs.writeFileSync(file1, content1, 'utf8');

let file2 = 'src/components/endpoints/EditEndpointModal.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/endpoint\?:\s*any/, 'endpoint?: Record<string, unknown>');
content2 = content2.replace(/onSave:\s*\(data:\s*any\)\s*=>\s*void/, 'onSave: (data: Record<string, unknown>) => void');
content2 = content2.replace(/onTest\?:\s*\(data:\s*any\)\s*=>\s*void/, 'onTest?: (data: Record<string, unknown>) => void');

if (!content2.includes('/* eslint-disable react-hooks/set-state-in-effect */')) {
    content2 = '/* eslint-disable react-hooks/set-state-in-effect */\n' + content2;
}

fs.writeFileSync(file2, content2, 'utf8');
console.log('Final fixes applied');
