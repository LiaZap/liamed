import fs from 'fs';
try {
    let raw = fs.readFileSync('lint_report.json', 'utf16le');
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    const data = JSON.parse(raw);
    const errors = data.filter(d => d.errorCount > 0 || d.warningCount > 0);
    const out = fs.createWriteStream('parsed_lint.txt');
    errors.forEach(e => {
        out.write('\n--- ' + e.filePath.replace(/\\/g, '/') + ' ---\n');
        e.messages.forEach(m => {
            out.write('  ' + m.line + ':' + m.column + ' ' + (m.severity === 2 ? '[ERROR]' : '[WARN ]') + ' ' + m.ruleId + '\n');
        });
    });
    out.end();
    console.log('Parsed successfully');
} catch (err) {
    console.error('Failed to parse:', err);
}
