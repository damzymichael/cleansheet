"use client";

import { useState, useEffect } from "react";
import { Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Layout from "@/components/layout";
import { EntryForm } from "@/components/entry-form";

export default function Home() {
    const [entries, setEntries] = useState<any[]>([]);
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        paid: 0,
        unpaid: 0,
        due: 0,
    });

    useEffect(() => {
        const stored = localStorage.getItem("entries");
        if (stored) {
            const parsed = JSON.parse(stored);
            setEntries(parsed);
            calculateStats(parsed);
        }
    }, []);

    const calculateStats = (entryList: any[]) => {
        const stats = {
            total: entryList.length,
            paid: entryList.filter(e => e.isPaid).length,
            unpaid: entryList.filter(e => !e.isPaid).length,
            due: entryList.filter(e => {
                const dueDate = new Date(e.dueDate);
                const today = new Date();
                const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
                return dueDate <= threeDays && dueDate >= today;
            }).length,
        };
        setStats(stats);
    };

    const handleAddEntry = (entry: any) => {
        const newEntries = [...entries, { ...entry, id: Date.now() }];
        setEntries(newEntries);
        localStorage.setItem("entries", JSON.stringify(newEntries));
        calculateStats(newEntries);
        setShowNewEntry(false);
    };

    const getUpcomingEntries = () => {
        const today = new Date();
        const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
        return entries.filter(e => {
            const dueDate = new Date(e.dueDate);
            return dueDate <= threeDays && dueDate >= today;
        });
    };

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground">Manage your dry-cleaning business</p>
                    </div>
                    <Button onClick={() => setShowNewEntry(true)} className="gap-2" size="lg">
                        <Plus className="w-5 h-5" />
                        New Entry
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                Paid
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.paid}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                Unpaid
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.unpaid}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Clock className="w-4 h-4 text-blue-600" />
                                Due Soon
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.due}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming Entries */}
                <Card>
                    <CardHeader>
                        <CardTitle>Due in Next 3 Days</CardTitle>
                        <CardDescription>
                            Entries that are ready to pick up or approaching their due date
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {getUpcomingEntries().length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No entries due in the next 3 days</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {getUpcomingEntries()
                                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                                    .map(entry => (
                                        <div
                                            key={entry.id}
                                            className="flex items-center justify-between p-4 border rounded-none"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-medium">{entry.customerName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {entry.items.length} item(s) •{" "}
                                                    {entry.items
                                                        .map((i: any) => i.quantity)
                                                        .reduce((a: number, b: number) => a + b, 0)}{" "}
                                                    pieces
                                                </p>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <p className="text-sm font-medium">
                                                    {new Date(entry.dueDate).toLocaleDateString()}
                                                </p>
                                                <div className="flex gap-2">
                                                    <Badge variant={entry.isPaid ? "default" : "secondary"}>
                                                        {entry.isPaid ? "Paid" : "Unpaid"}
                                                    </Badge>
                                                    <Badge variant="outline">₹{entry.price}</Badge>
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
