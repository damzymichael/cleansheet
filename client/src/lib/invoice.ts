import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function generateInvoice({
    customerName,
    items,
    total,
    entryDate,
    organizationName,
    bankDetails,
    deliveryFee,
    discount,
}: {
    customerName: string;
    items: any[];
    total: number;
    entryDate: string;
    organizationName?: string;
    bankDetails?: { bankName: string; accountNumber: string; accountName: string };
    deliveryFee?: number;
    discount?: number;
}) {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    // doc.text("LAUNDRY", 105, 20, { align: "center" });
    doc.text(organizationName || "LAUNDRY", 105, 20, { align: "center" });

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

    // Calculate footer rows
    const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
    const footerRows = [];

    footerRows.push([
        { content: "Subtotal", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
        `N${itemsTotal.toLocaleString()}`,
    ]);

    if (discount && discount > 0) {
        const discountAmount = (discount / 100) * itemsTotal;
        footerRows.push([
            { content: `Discount (${discount}%)`, colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
            `-N${discountAmount.toLocaleString()}`,
        ]);
    }

    if (deliveryFee && deliveryFee > 0) {
        footerRows.push([
            { content: "Delivery Fee", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
            `N${deliveryFee.toLocaleString()}`,
        ]);
    }

    footerRows.push([
        {
            content: "Total Amount",
            colSpan: 3,
            styles: { halign: "right", fontStyle: "bold", fillColor: [64, 118, 241], textColor: 255 },
        },
        {
            content: `N${total.toLocaleString()}`,
            styles: { fontStyle: "bold", fillColor: [64, 118, 241], textColor: 255 },
        },
    ]);

    autoTable(doc, {
        startY: 75,
        head: [["Item", "Quantity", "Rate", "Amount"]],
        body: tableData,
        foot: footerRows as any,
        theme: "striped",
        headStyles: { fillColor: [64, 118, 241], textColor: 255 },
        styles: { font: "helvetica", fontSize: 10 },
        footStyles: { fillColor: [240, 240, 240], textColor: 0 },
    });

    // Bank Details
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    if (bankDetails && bankDetails.bankName && bankDetails.accountNumber) {
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text("PAYMENT DETAILS", 14, finalY);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`Bank Name: ${bankDetails.bankName}`, 14, finalY + 7);
        doc.text(`Account No: ${bankDetails.accountNumber}`, 14, finalY + 14);
        doc.text(`Account Name: ${bankDetails.accountName || ""}`, 14, finalY + 21);
    }

    // Footer
    const footerY = Math.max(finalY + 35, (doc as any).lastAutoTable.finalY + 40);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Thank you for your business!", 105, footerY, { align: "center" });
    doc.text("Goods once received in good condition cannot be returned.", 105, footerY + 6, { align: "center" });

    doc.save(`${customerName}_${dateStr}.pdf`);
    return doc.output("blob");
}
