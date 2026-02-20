import fs from 'fs';

let file1 = 'src/components/diagnosis/ConsultationDetailsModal.tsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(/node: _, /g, '');
fs.writeFileSync(file1, content1, 'utf8');

let file2 = 'src/components/users/EditUserModal.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace('catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars', 'catch {');
content2 = content2.replace('catch (error) {', 'catch {');
fs.writeFileSync(file2, content2, 'utf8');

console.log('Fixed residuals');
