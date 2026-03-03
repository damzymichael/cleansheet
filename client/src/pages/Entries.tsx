import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Edit2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Layout from "@/components/layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

export default function Entries() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    // Delete Confirmation Logic
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

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

    const confirmDelete = () => {
        if (entryToDelete !== null) {
            const newEntries = entries.filter(e => e.id !== entryToDelete);
            setEntries(newEntries);
            localStorage.setItem("entries", JSON.stringify(newEntries));
            setIsDeleteDialogOpen(false);
            setEntryToDelete(null);
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
            <div className="space-y-8">
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
                            onValueChange={value => setFilterStatus(value ?? "All")}
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
                                                {entry.items.map((item: any, idx: number) => (
                                                    <Badge
                                                        key={idx}
                                                        variant="outline"
                                                        className="bg-background/50 font-normal"
                                                    >
                                                        {item.quantity}x {item.clothName}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 border-t sm:border-0 pt-4 sm:pt-0">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-foreground">
                                                    ₦{entry.price.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-10 w-10 text-muted-foreground hover:text-primary hover:border-primary"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
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
            </div>
        </Layout>
    );
}
