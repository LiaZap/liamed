import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CSV Export ---

export const exportToCSV = (data: (string | number | boolean | null)[][], headers: string[], filename: string) => {
    // 1. Create CSV Header Row
    const csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + data.map(row => {
            return row.map((field) => {
                // Escape quotes and wrap in quotes if necessary
                if (typeof field === 'string') {
                    return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
            }).join(",");
        }).join("\n");

    // 2. Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- PDF Export ---

export const exportToPDF = (
    data: (string | number | boolean | null)[][],
    headers: string[],
    title: string,
    filename: string
) => {
    const doc = new jsPDF();

    // 1. Add Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    // 2. Add Timestamp
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 30);

    // 3. Generate Table
    autoTable(doc, {
        head: [headers],
        body: data,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }, // Blue header
        styles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // 4. Save
    doc.save(`${filename}.pdf`);
};
