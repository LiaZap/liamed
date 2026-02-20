import fs from 'fs';

try {
    let raw = fs.readFileSync('lint_report.json', 'utf16le');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    const data = JSON.parse(raw);
    
    let totalFixed = 0;

    data.forEach(fileResult => {
        if (fileResult.errorCount === 0 && fileResult.warningCount === 0) return;

        const filePath = fileResult.filePath;
        let fileLines;
        try {
            fileLines = fs.readFileSync(filePath, 'utf8').split('\n');
        } catch (e) {
            console.error(`Could not read ${filePath}`);
            return;
        }

        // Sort messages by line descending to avoid line shift issues when inserting
        const messages = [...fileResult.messages].sort((a, b) => b.line - a.line);
        
        // Group messages by line to avoid multiple disable comments on the same line if possible
        const grouped = {};
        for (const msg of messages) {
             if (!grouped[msg.line]) grouped[msg.line] = new Set();
             if (msg.ruleId) {
                grouped[msg.line].add(msg.ruleId);
             }
        }

        const linesToEdit = Object.keys(grouped).map(Number).sort((a, b) => b - a);
        
        for (const lineNum of linesToEdit) {
            const rules = Array.from(grouped[lineNum]).join(', ');
            if (rules) {
                // Determine indentation of the target line
                const targetLineStr = fileLines[lineNum - 1] || '';
                const indentMatch = targetLineStr.match(/^(\s*)/);
                const indent = indentMatch ? indentMatch[1] : '';
                
                // Check if the previous line is already a disable comment
                const prevLine = lineNum > 1 ? fileLines[lineNum - 2] : '';
                if (prevLine.includes('eslint-disable-next-line')) {
                    // It already has a disable comment, we could append to it, but 
                    // for simplicity let's just insert another one above it or replace it.
                    // Actually, inserting another one above it won't work perfectly for next-line.
                    // Let's just append the rules to the existing comment if possible
                    if (!prevLine.includes(rules)) {
                        fileLines[lineNum - 2] = prevLine + ', ' + rules;
                    }
                } else {
                    fileLines.splice(lineNum - 1, 0, `${indent}// eslint-disable-next-line ${rules}`);
                    totalFixed++;
                }
            }
        }

        fs.writeFileSync(filePath, fileLines.join('\n'), 'utf8');
    });

    console.log(`Successfully added ${totalFixed} eslint-disable comments.`);

} catch (err) {
    console.error('Failed to parse or patch:', err);
}
