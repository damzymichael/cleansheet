import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function generateInvoice({
    customerName,
    items,
    total,
    entryDate,
}: {
    customerName: string;
    items: any[];
    total: number;
    entryDate: string;
}) {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("LAUNDRY", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Professional Dry Cleaning Services", 105, 26, { align: "center" });

    // Invoice Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice Date: ${dateStr}`, 14, 45);
    doc.text(`Entry Date: ${new Date(entryDate).toLocaleDateString()}`, 14, 52);
    doc.text(`Customer: ${customerName}`, 14, 65);

    // Items Table
    const tableData = items.map(item => [
        item.clothName,
        item.quantity.toString(),
        `N${(item.price / item.quantity).toLocaleString()}`,
        `N${item.price.toLocaleString()}`,
    ]);

    autoTable(doc, {
        startY: 75,
        head: [["Item", "Quantity", "Rate", "Amount"]],
        body: tableData,
        foot: [
            [
                { content: "Total Amount", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
                `N${total.toLocaleString()}`,
            ],
        ],
        theme: "striped",
        headStyles: { fillColor: [64, 118, 241], textColor: 255 },
        styles: { font: "helvetica", fontSize: 10 },
        footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: "bold" },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Thank you for your business!", 105, finalY + 20, { align: "center" });
    doc.text("Goods once received in good condition cannot be returned.", 105, finalY + 26, { align: "center" });

    return doc.output("blob");
}
