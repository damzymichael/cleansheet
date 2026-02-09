import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Layout from "@/components/layout";
import { EntryForm } from "@/components/entry-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Entries() {
    const [entries, setEntries] = useState<any[]>([]);
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("entries");
        if (stored) {
            setEntries(JSON.parse(stored));
        }
    }, []);

    const handleAddEntry = (entry: any) => {
        const newEntries = [...entries, { ...entry, id: Date.now() }];
        setEntries(newEntries);
        localStorage.setItem("entries", JSON.stringify(newEntries));
        setShowNewEntry(false);
    };

    const handleDeleteEntry = (id: number) => {
        const newEntries = entries.filter(e => e.id !== id);
        setEntries(newEntries);
        localStorage.setItem("entries", JSON.stringify(newEntries));
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Entries</h1>
                        <p className="text-muted-foreground">Manage all customer entries</p>
                    </div>
                    <Button onClick={() => setShowNewEntry(true)} className="gap-2" size="lg">
                        <Plus className="w-5 h-5" />
                        New Entry
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-sm font-medium">Search</label>
                        <Input
                            placeholder="Search by customer name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Status</label>
                        {/* @ts-ignore  */}
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-40 mt-2">
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

                {/* Entries Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Entries</CardTitle>
                        <CardDescription>{filteredEntries.length} entries found</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredEntries.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No entries found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredEntries.map(entry => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center justify-between p-4 border rounded-none hover:bg-muted transition"
                                    >
                                        <div className="space-y-2 flex-1">
                                            <p className="font-medium text-lg">{entry.customerName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {entry.items.length} item(s) • Due:{" "}
                                                {new Date(entry.dueDate).toLocaleDateString()}
                                            </p>
                                            <div className="flex gap-2 flex-wrap">
                                                {entry.items.map((item: any, idx: number) => (
                                                    <Badge key={idx} variant="secondary">
                                                        {item.quantity}x {item.clothName}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <p className="text-lg font-bold">₹{entry.price}</p>
                                            <div className="flex gap-2">
                                                <Badge variant={entry.isPaid ? "default" : "secondary"}>
                                                    {entry.isPaid ? "Paid" : "Unpaid"}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Button variant="ghost" size="icon">
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
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
            </div>

            {/* New Entry Dialog */}
            <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Entry</DialogTitle>
                    </DialogHeader>
                    <EntryForm onSubmit={handleAddEntry} onCancel={() => setShowNewEntry(false)} />
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
