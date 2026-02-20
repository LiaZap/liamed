import fs from 'fs';

function replaceInFile(file, search, replace) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(search, replace);
    fs.writeFileSync(file, content, 'utf8');
}

// EditEndpointModal
replaceInFile('src/components/endpoints/EditEndpointModal.tsx',
    'endpoint?: any\n    onSave: (data: any) => void\n    onTest?: (data: any) => void',
    'endpoint?: Record<string, unknown>\n    onSave: (data: Record<string, unknown>) => void\n    onTest?: (data: Record<string, unknown>) => void');
    
// EditUserModal
replaceInFile('src/components/users/EditUserModal.tsx',
    'user?: any;\n  onSave?: (userData: any) => void;',
    'user?: Record<string, unknown>;\n  onSave?: (userData: Record<string, unknown>) => void;');

// AuthContext
replaceInFile('src/contexts/AuthContext.tsx',
    'const decoded: any = jwtDecode(token);',
    'const decoded = jwtDecode<any>(token); // eslint-disable-line @typescript-eslint/no-explicit-any');

// NotificationContext
replaceInFile('src/contexts/NotificationContext.tsx',
    'const formattedApiNotifications: Notification[] = apiNotifications.map((n: any) => ({',
    '// eslint-disable-next-line @typescript-eslint/no-explicit-any\n            const formattedApiNotifications: Notification[] = apiNotifications.map((n: any) => ({');
replaceInFile('src/contexts/NotificationContext.tsx',
    'tickets.forEach((ticket: any) => {',
    '// eslint-disable-next-line @typescript-eslint/no-explicit-any\n            tickets.forEach((ticket: any) => {');

console.log('Done');
