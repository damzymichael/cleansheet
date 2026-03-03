"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout";

import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

interface Staff {
    id: number;
    name: string;
    email: string;
    password: string;
    permissions: {
        read: boolean;
        write: boolean;
        manageUsers: boolean;
    };
}

export default function Staff() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        permissions: {
            read: true,
            write: false,
            manageUsers: false,
        },
    });

    // Delete Confirmation Logic
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState<number | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("staff");
        if (stored) {
            setStaff(JSON.parse(stored));
        }
    }, []);

    const handleAddOrEdit = () => {
        if (!formData.name || !formData.email || !formData.password) {
            alert("Please fill in all required fields");
            return;
        }

        if (editingId) {
            const updated = staff.map(s => (s.id === editingId ? { ...s, ...formData } : s));
            setStaff(updated);
            localStorage.setItem("staff", JSON.stringify(updated));
            setEditingId(null);
        } else {
            const newStaff: Staff = {
                id: Date.now(),
                ...formData,
            };
            const updated = [...staff, newStaff];
            setStaff(updated);
            localStorage.setItem("staff", JSON.stringify(updated));
        }

        setFormData({
            name: "",
            email: "",
            password: "",
            permissions: {
                read: true,
                write: false,
                manageUsers: false,
            },
        });
        setShowDialog(false);
    };

    const handleEdit = (s: Staff) => {
        setFormData({
            name: s.name,
            email: s.email,
            password: s.password,
            permissions: s.permissions,
        });
        setEditingId(s.id);
        setShowDialog(true);
    };

    const handleDeleteClick = (id: number) => {
        setStaffToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (staffToDelete !== null) {
            const updated = staff.filter(s => s.id !== staffToDelete);
            setStaff(updated);
            localStorage.setItem("staff", JSON.stringify(updated));
            setIsDeleteDialogOpen(false);
            setStaffToDelete(null);
        }
    };

    const handleNewClick = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            permissions: {
                read: true,
                write: false,
                manageUsers: false,
            },
        });
        setEditingId(null);
        setShowDialog(true);
    };

    const togglePermission = (permission: "read" | "write" | "manageUsers", value: boolean) => {
        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions,
                [permission]: value,
            },
        });
    };

    const getPermissionBadges = (permissions: Staff["permissions"]) => {
        return Object.entries(permissions)
            .filter(([, value]) => value)
            .map(([key]) => {
                const labels: Record<string, string> = {
                    read: "Read",
                    write: "Write",
                    manageUsers: "Manage Users",
                };
                return labels[key];
            });
    };

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Staff Management</h1>
                        <p className="text-sm md:text-base text-muted-foreground mt-1">
                            Manage staff and their system permissions
                        </p>
                    </div>
                    <Button onClick={handleNewClick} className="gap-2 w-full sm:w-auto" size="lg">
                        <Plus className="w-5 h-5" />
                        Add Staff Member
                    </Button>
                </div>

                {/* Staff Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.length === 0 ? (
                        <div className="col-span-full text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
                            <p className="text-lg">No staff members added yet</p>
                        </div>
                    ) : (
                        staff.map(member => (
                            <Card
                                key={member.id}
                                className="border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                            >
                                <CardHeader className="bg-muted/30 border-b pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl">{member.name}</CardTitle>
                                            <CardDescription className="text-sm font-medium">
                                                {member.email}
                                            </CardDescription>
                                        </div>
                                        <Shield className="w-5 h-5 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Permissions
                                        </p>
                                        <div className="flex gap-2 flex-wrap">
                                            {getPermissionBadges(member.permissions).length > 0 ? (
                                                getPermissionBadges(member.permissions).map(perm => (
                                                    <Badge
                                                        key={perm}
                                                        variant="secondary"
                                                        className="font-normal capitalize"
                                                    >
                                                        {perm}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    No access
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 hover:text-primary hover:border-primary"
                                            onClick={() => handleEdit(member)}
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 hover:text-destructive hover:border-destructive"
                                            onClick={() => handleDeleteClick(member.id)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <ConfirmDeleteDialog
                    isOpen={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    onConfirm={confirmDelete}
                    title="Delete Staff Member"
                    description={`Are you sure you want to delete ${staff.find(s => s.id === staffToDelete)?.name || "this staff member"}? This will revoke all their system access.`}
                />
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                placeholder="Staff member name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="staff@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Secure password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Permissions</Label>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="read"
                                        checked={formData.permissions.read}
                                        onCheckedChange={checked => togglePermission("read", checked as boolean)}
                                    />
                                    <Label htmlFor="read" className="font-normal cursor-pointer">
                                        Read - View entries, customers, and clothes
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="write"
                                        checked={formData.permissions.write}
                                        onCheckedChange={checked => togglePermission("write", checked as boolean)}
                                    />
                                    <Label htmlFor="write" className="font-normal cursor-pointer">
                                        Write - Create and edit entries
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="manageUsers"
                                        checked={formData.permissions.manageUsers}
                                        onCheckedChange={checked => togglePermission("manageUsers", checked as boolean)}
                                    />
                                    <Label htmlFor="manageUsers" className="font-normal cursor-pointer">
                                        Manage Users - Add and edit staff members
                                    </Label>
                                </div>
                            </div>
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
        </Layout>
    );
}
