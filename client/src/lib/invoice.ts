import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatDate(date: Date) {
    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return `${getOrdinal(day)} of ${month}, ${year}`;
}

export async function generateInvoice({
    customerName,
    items,
    total,
    organizationName,
    bankDetails,
    deliveryFee,
    discount,
    businessPhone,
    businessAddress,
    customerPhone,
    customerAddress,
    invoiceId,
}: {
    customerName: string;
    items: any[];
    total: number;
    organizationName?: string;
    bankDetails?: { bankName: string; accountNumber: string; accountName: string };
    deliveryFee?: number;
    discount?: number;
    businessPhone?: string;
    businessAddress?: string;
    customerPhone?: string;
    customerAddress?: string;
    invoiceId: string | number;
}) {
    const doc = new jsPDF();
    const dateStr = formatDate(new Date());

    // --- Header / Business Info ---
    doc.setFontSize(24);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text(organizationName || "LAUNDRY", 14, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    let headerY = 32;
    if (businessAddress) {
        doc.text(`Address: ${businessAddress}`, 14, headerY);
        headerY += 5;
    }
    if (businessPhone) {
        doc.text(`Phone number: ${businessPhone}`, 14, headerY);
    }

    // --- Invoice Info (Top Right) ---
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`INVOICE: #${invoiceId}`, 196, 25, { align: "right" });
    doc.text(`DATE: ${dateStr}`, 196, 30, { align: "right" });

    // --- Bill To Section ---
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", 14, 55);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(customerName, 14, 61);

    let billingY = 66;
    if (customerPhone) {
        doc.text(`Tel: ${customerPhone}`, 14, billingY);
        billingY += 5;
    }
    if (customerAddress) {
        doc.text(customerAddress, 14, billingY, { maxWidth: 80 });
    }

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
        startY: 85,
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
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text("PAYMENT DETAILS", 14, finalY);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(40, 40, 40);
        doc.text(`Bank Name: ${bankDetails.bankName}`, 14, finalY + 7);
        doc.text(`Account No: ${bankDetails.accountNumber}`, 14, finalY + 14);
        doc.text(`Account Name: ${bankDetails.accountName || ""}`, 14, finalY + 21);
    }

    // Footer
    const footerY = Math.max(finalY + 40, (doc as any).lastAutoTable.finalY + 45);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(
        "Thank you for your services, We would love to hear from you again and your feedback is welcome",
        105,
        footerY,
        { align: "center", maxWidth: 180 },
    );

    return doc.output("blob");
}
