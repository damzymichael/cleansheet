"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout";

interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
}

export default function Customers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [entries, setEntries] = useState<any[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
    });

    useEffect(() => {
        const storedCustomers = localStorage.getItem("customers");
        if (storedCustomers) {
            setCustomers(JSON.parse(storedCustomers));
        }
        const storedEntries = localStorage.getItem("entries");
        if (storedEntries) {
            setEntries(JSON.parse(storedEntries));
        }
    }, []);

    const handleAddOrEdit = () => {
        if (!formData.name) {
            alert("Please enter customer name");
            return;
        }

        if (editingId) {
            const updated = customers.map(c => (c.id === editingId ? { ...c, ...formData } : c));
            setCustomers(updated);
            localStorage.setItem("customers", JSON.stringify(updated));
            setEditingId(null);
        } else {
            const newCustomer: Customer = {
                id: Date.now(),
                ...formData,
            };
            const updated = [...customers, newCustomer];
            setCustomers(updated);
            localStorage.setItem("customers", JSON.stringify(updated));
        }

        setFormData({ name: "", phone: "", email: "", address: "" });
        setShowDialog(false);
    };

    const handleEdit = (customer: Customer) => {
        setFormData({
            name: customer.name,
            phone: customer.phone || "",
            email: customer.email || "",
            address: customer.address || "",
        });
        setEditingId(customer.id);
        setShowDialog(true);
    };

    const handleDelete = (id: number) => {
        const updated = customers.filter(c => c.id !== id);
        setCustomers(updated);
        localStorage.setItem("customers", JSON.stringify(updated));
    };

    const handleNewClick = () => {
        setFormData({ name: "", phone: "", email: "", address: "" });
        setEditingId(null);
        setShowDialog(true);
    };

    const getCustomerStats = (customerName: string) => {
        const customerEntries = entries.filter(e => e.customerName === customerName);
        return {
            totalEntries: customerEntries.length,
            totalSpent: customerEntries.reduce((sum, e) => sum + e.price, 0),
            unpaidEntries: customerEntries.filter(e => !e.isPaid).length,
        };
    };

    const handleViewHistory = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowHistory(true);
    };

    const selectedCustomerEntries = selectedCustomer
        ? entries.filter(e => e.customerName === selectedCustomer.name)
        : [];

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Customers</h1>
                        <p className="text-muted-foreground">Manage customer profiles and history</p>
                    </div>
                    <Button onClick={handleNewClick} className="gap-2" size="lg">
                        <Plus className="w-5 h-5" />
                        Add Customer
                    </Button>
                </div>

                {/* Customers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Customers</CardTitle>
                        <CardDescription>{customers.length} customers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {customers.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No customers added yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {customers.map(customer => {
                                    const stats = getCustomerStats(customer.name);
                                    return (
                                        <div
                                            key={customer.id}
                                            className="flex items-center justify-between p-4 border rounded-none hover:bg-muted transition"
                                        >
                                            <div className="space-y-2 flex-1">
                                                <p className="font-medium text-lg">{customer.name}</p>
                                                {customer.phone && (
                                                    <p className="text-sm text-muted-foreground">📞 {customer.phone}</p>
                                                )}
                                                {customer.email && (
                                                    <p className="text-sm text-muted-foreground">✉️ {customer.email}</p>
                                                )}
                                                {customer.address && (
                                                    <p className="text-sm text-muted-foreground">
                                                        📍 {customer.address}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right space-y-3">
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Entries</p>
                                                        <p className="text-lg font-bold">{stats.totalEntries}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Total Spent</p>
                                                        <p className="text-lg font-bold">
                                                            ₹{stats.totalSpent.toFixed(0)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Unpaid</p>
                                                        <p className="text-lg font-bold text-amber-600">
                                                            {stats.unpaidEntries}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewHistory(customer)}
                                                    >
                                                        <BarChart3 className="w-4 h-4 mr-1" />
                                                        History
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(customer)}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(customer.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder="Customer name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                placeholder="10-digit phone number"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="customer@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                placeholder="Customer address"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddOrEdit}>{editingId ? "Update" : "Add"}</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedCustomer?.name} - Entry History</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {selectedCustomerEntries.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No entries found</p>
                        ) : (
                            selectedCustomerEntries.map(entry => (
                                <div key={entry.id} className="p-4 border rounded-none space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium">
                                            Due: {new Date(entry.dueDate).toLocaleDateString()}
                                        </p>
                                        <Badge variant={entry.isPaid ? "default" : "secondary"}>
                                            {entry.isPaid ? "Paid" : "Unpaid"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {entry.items.map((i: any) => `${i.quantity}x ${i.clothName}`).join(", ")}
                                    </p>
                                    <p className="text-lg font-bold">₹{entry.price}</p>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
