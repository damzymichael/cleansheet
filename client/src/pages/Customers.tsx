"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Edit2, User, Phone, Mail, MapPin, Search, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
}

export default function Customers() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [entries, setEntries] = useState<any[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
    });

    // Delete Confirmation Logic
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);

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

    const handleEdit = (customer: Customer, e: React.MouseEvent) => {
        e.stopPropagation(); // Don't navigate when editing
        setFormData({
            name: customer.name,
            phone: customer.phone || "",
            email: customer.email || "",
            address: customer.address || "",
        });
        setEditingId(customer.id);
        setShowDialog(true);
    };

    const handleDeleteClick = (id: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Don't navigate when deleting
        setCustomerToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (customerToDelete !== null) {
            const updated = customers.filter(c => c.id !== customerToDelete);
            setCustomers(updated);
            localStorage.setItem("customers", JSON.stringify(updated));
            setIsDeleteDialogOpen(false);
            setCustomerToDelete(null);
        }
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

    const filteredCustomers = customers.filter(
        c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm)),
    );

    return (
        <Layout>
            <div className="space-y-8 pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Customers</h1>
                        <p className="text-sm md:text-base text-muted-foreground mt-1">
                            Manage profiles and view detailed service history
                        </p>
                    </div>
                    <Button onClick={handleNewClick} className="gap-2 w-full sm:w-auto" size="lg">
                        <Plus className="w-5 h-5" />
                        Add Customer
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
                    <div className="flex-1 relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or phone..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 h-11"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="grid gap-4">
                    {filteredCustomers.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                            <p className="text-lg">No customers found</p>
                        </div>
                    ) : (
                        filteredCustomers.map(customer => {
                            const stats = getCustomerStats(customer.name);
                            return (
                                <div
                                    key={customer.id}
                                    onClick={() => navigate(`/customers/${customer.id}`)}
                                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border rounded-xl bg-background/50 hover:border-primary/50 hover:bg-muted/30 transition-all duration-200 gap-4 group cursor-pointer"
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 flex-1 w-full">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-2 flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-xl text-foreground truncate">
                                                    {customer.name}
                                                </h3>
                                                {stats.unpaidEntries > 0 && (
                                                    <Badge variant="destructive" className="h-5">
                                                        {stats.unpaidEntries} Unpaid
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 gap-y-1">
                                                {customer.phone && (
                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        <span>{customer.phone}</span>
                                                    </div>
                                                )}
                                                {customer.email && (
                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span className="truncate">{customer.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0">
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                                                    Entries
                                                </p>
                                                <p className="font-bold">{stats.totalEntries}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">
                                                    Total Value
                                                </p>
                                                <p className="font-bold">₦{stats.totalSpent.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={e => handleEdit(customer, e)}
                                                className="h-9 w-9 opacity-50 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={e => handleDeleteClick(customer.id, e)}
                                                className="h-9 w-9 opacity-50 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground/20 group-hover:text-primary transition-colors ml-2" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <ConfirmDeleteDialog
                    isOpen={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    onConfirm={confirmDelete}
                    title="Delete Customer Profile"
                    description={`Are you sure you want to delete ${customers.find(c => c.id === customerToDelete)?.name || "this customer"}? This will remove all their information and history.`}
                />
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {editingId ? "Edit Customer Details" : "New Customer Registration"}
                        </DialogTitle>
                        <CardDescription>Fill in the basic information to manage this profile.</CardDescription>
                    </DialogHeader>
                    <div className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-semibold">
                                Full Name *
                            </Label>
                            <Input
                                id="name"
                                placeholder="Enter full name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-semibold">
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone"
                                    placeholder="080 123 4567"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="customer@email.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-sm font-semibold">
                                Residential Address
                            </Label>
                            <Input
                                id="address"
                                placeholder="Enter home address"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t mt-6">
                            <Button variant="outline" onClick={() => setShowDialog(false)} type="button">
                                Cancel
                            </Button>
                            <Button onClick={handleAddOrEdit} className="px-8 shadow-sm">
                                {editingId ? "Save Changes" : "Register Customer"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
