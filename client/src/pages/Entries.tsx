import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Layout from "@/components/layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Share2, Check } from "lucide-react";
import { getInvoice, deleteInvoice, saveInvoice } from "@/lib/db";
import { generateInvoice } from "@/lib/invoice";
import { toast } from "sonner";

export default function Entries() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Delete Confirmation Logic
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

    // Show More Dialog State
    const [showMoreEntry, setShowMoreEntry] = useState<any>(null);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    // Paid Confirmation State
    const [isPaidDialogOpen, setIsPaidDialogOpen] = useState(false);
    const [entryToMarkAsPaid, setEntryToMarkAsPaid] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem("entries");
        if (stored) {
            setEntries(JSON.parse(stored));
        }
    }, [isDeleteDialogOpen]); // Refresh after delete confirmation if needed

    const handleDeleteEntry = (id: number) => {
        setEntryToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (entryToDelete !== null) {
            const newEntries = entries.filter(e => e.id !== entryToDelete);
            setEntries(newEntries);
            localStorage.setItem("entries", JSON.stringify(newEntries));

            // Also cleanup PDF if it exists
            await deleteInvoice(entryToDelete);

            setIsDeleteDialogOpen(false);
            setEntryToDelete(null);
            toast.success("Entry deleted");
        }
    };

    const handleMarkAsPaidClick = (entry: any) => {
        setEntryToMarkAsPaid(entry);
        setIsPaidDialogOpen(true);
    };

    const confirmMarkAsPaid = async () => {
        if (!entryToMarkAsPaid) return;

        const newEntries = entries.map(e => (e.id === entryToMarkAsPaid.id ? { ...e, isPaid: true } : e));
        setEntries(newEntries);
        localStorage.setItem("entries", JSON.stringify(newEntries));

        // Delete PDF once paid
        await deleteInvoice(entryToMarkAsPaid.id);
        setIsPaidDialogOpen(false);
        setEntryToMarkAsPaid(null);
        toast.success("Entry marked as paid");
    };

    const handleShare = async (entry: any) => {
        try {
            let blob = await getInvoice(entry.id);

            // If not found, regenerate it!
            if (!blob) {
                toast.info("Regenerating missing invoice...");
                const settings = JSON.parse(localStorage.getItem("settings") || "{}");
                blob = await generateInvoice({
                    customerName: entry.customerName,
                    items: entry.items,
                    total: entry.price,
                    entryDate: entry.createdAt || new Date().toISOString(),
                    organizationName: settings.orgName,
                    bankDetails: {
                        bankName: settings.bankName,
                        accountNumber: settings.bankAccount,
                        accountName: settings.accountName,
                    },
                    deliveryFee: entry.deliveryFee || 0,
                    discount: entry.discount || 0,
                });
                // Save it back for future use
                await saveInvoice(entry.id, blob);
            }

            const file = new File([blob], `Invoice-${entry.customerName}.pdf`, { type: "application/pdf" });

            if (navigator.share) {
                navigator.share({
                    files: [file],
                    title: `Invoice for ${entry.customerName}`,
                    text: `Laundry invoice for ${entry.customerName} - ₦${entry.price.toLocaleString()}`,
                });
            } else {
                const url = URL.createObjectURL(blob);
                window.open(url);
                toast.info("Opening invoice in new tab (Sharing not supported)");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to share invoice");
        }
    };

    const filteredEntries = entries.filter(entry => {
        const matchesStatus =
            filterStatus === "all" ||
            (filterStatus === "paid" && entry.isPaid) ||
            (filterStatus === "unpaid" && !entry.isPaid);
        const matchesSearch = entry.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <Layout>
            <div className="space-y-8 pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Entries</h1>
                        <p className="text-sm md:text-base text-muted-foreground mt-1">
                            Manage all customer laundry entries
                        </p>
                    </div>
                    <Button onClick={() => navigate("/entries/new")} className="gap-2 w-full sm:w-auto" size="lg">
                        <Plus className="w-5 h-5" />
                        New Entry
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end font-sans">
                    <div className="flex-1 relative">
                        <label className="text-sm font-medium mb-1.5 block text-foreground/80">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by customer name..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 h-11"
                            />
                        </div>
                    </div>
                    <div className="w-full sm:w-48">
                        <label className="text-sm font-medium mb-1.5 block text-foreground/80">Status</label>
                        <Select
                            value={filterStatus}
                            // It's supposed to map the value to the display
                            onValueChange={value => setFilterStatus(value ?? "all")}
                        >
                            <SelectTrigger className="w-full h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Entries List */}
                <Card className="border-border shadow-sm">
                    <CardHeader className="border-b pb-4">
                        <CardTitle className="text-xl">Active Entries</CardTitle>
                        <CardDescription>
                            {filteredEntries.length} items currently in processing or completed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {filteredEntries.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                <p className="text-lg">No entries found matching your criteria</p>
                                <Button
                                    variant="link"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setFilterStatus("all");
                                    }}
                                    className="mt-2 text-primary"
                                >
                                    Clear all filters
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredEntries.map(entry => (
                                    <div
                                        key={entry.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 gap-4 group"
                                    >
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-3">
                                                <p className="font-semibold text-xl text-foreground">
                                                    {entry.customerName}
                                                </p>
                                                <Badge variant={entry.isPaid ? "default" : "secondary"} className="h-6">
                                                    {entry.isPaid ? "Paid" : "Unpaid"}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                                <span>{entry.items.length} item(s)</span>
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40"></span>
                                                <span>
                                                    Due:{" "}
                                                    {new Date(entry.dueDate).toLocaleDateString("en-NG", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            </p>
                                            <div className="flex gap-2 flex-wrap">
                                                {entry.items.slice(0, 2).map((item: any, idx: number) => (
                                                    <Badge
                                                        key={idx}
                                                        variant="outline"
                                                        className="bg-background/50 font-normal"
                                                    >
                                                        {item.quantity}x {item.clothName}
                                                    </Badge>
                                                ))}
                                                {entry.items.length > 2 && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-6 px-1 text-xs text-primary"
                                                        onClick={() => {
                                                            setShowMoreEntry(entry);
                                                            setIsMoreOpen(true);
                                                        }}
                                                    >
                                                        +{entry.items.length - 2} more...
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 border-t sm:border-0 pt-4 sm:pt-0">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-foreground">
                                                    ₦{entry.price.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                {!entry.isPaid && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            title="Mark as Paid"
                                                            className="h-10 w-10 text-green-600 hover:text-white hover:bg-green-600 hover:border-green-600"
                                                            onClick={() => handleMarkAsPaidClick(entry)}
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            title="Share Invoice"
                                                            className="h-10 w-10 text-primary hover:text-white hover:bg-primary hover:border-primary"
                                                            onClick={() => handleShare(entry)}
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-10 w-10 text-muted-foreground hover:text-destructive hover:border-destructive"
                                                    onClick={() => handleDeleteEntry(entry.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <ConfirmDeleteDialog
                    isOpen={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    onConfirm={confirmDelete}
                    title="Delete Entry"
                    description="Are you sure you want to delete this entry? This will permanently remove it from the records."
                />

                {/* Show More Dialog */}
                <Dialog open={isMoreOpen} onOpenChange={setIsMoreOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Order Items - {showMoreEntry?.customerName}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="border rounded-lg divide-y">
                                {showMoreEntry?.items.map((item: any, idx: number) => (
                                    <div key={idx} className="p-3 flex justify-between items-center">
                                        <span className="font-medium">
                                            {item.quantity}x {item.clothName}
                                        </span>
                                        <span className="text-muted-foreground">₦{item.price.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center pt-2 px-1">
                                <span className="font-bold text-lg">Total</span>
                                <span className="font-bold text-lg text-primary">
                                    ₦{showMoreEntry?.price.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setIsMoreOpen(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Paid Confirmation Dialog */}
                <Dialog open={isPaidDialogOpen} onOpenChange={setIsPaidDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Confirm Payment</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-muted-foreground">
                                Are you sure you want to mark the entry for{" "}
                                <span className="font-bold text-foreground">"{entryToMarkAsPaid?.customerName}"</span>{" "}
                                as paid? This will also remove the temporary invoice file.
                            </p>
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsPaidDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmMarkAsPaid}>
                                Yes, Mark as Paid
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}
