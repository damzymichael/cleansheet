"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Layout from "@/components/layout";

interface Cloth {
    id: number;
    name: string;
    price: number;
}

export default function Clothes() {
    const [clothes, setClothes] = useState<Cloth[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: "", price: "" });

    useEffect(() => {
        const stored = localStorage.getItem("clothes");
        if (stored) {
            setClothes(JSON.parse(stored));
        }
    }, []);

    const handleAddOrEdit = () => {
        if (!formData.name || !formData.price) {
            alert("Please fill in all fields");
            return;
        }

        if (editingId) {
            const updated = clothes.map(c =>
                c.id === editingId ? { ...c, name: formData.name, price: parseFloat(formData.price) } : c,
            );
            setClothes(updated);
            localStorage.setItem("clothes", JSON.stringify(updated));
            setEditingId(null);
        } else {
            const newCloth: Cloth = {
                id: Date.now(),
                name: formData.name,
                price: parseFloat(formData.price),
            };
            const updated = [...clothes, newCloth];
            setClothes(updated);
            localStorage.setItem("clothes", JSON.stringify(updated));
        }

        setFormData({ name: "", price: "" });
        setShowDialog(false);
    };

    const handleEdit = (cloth: Cloth) => {
        setFormData({ name: cloth.name, price: cloth.price.toString() });
        setEditingId(cloth.id);
        setShowDialog(true);
    };

    const handleDelete = (id: number) => {
        const updated = clothes.filter(c => c.id !== id);
        setClothes(updated);
        localStorage.setItem("clothes", JSON.stringify(updated));
    };

    const handleNewClick = () => {
        setFormData({ name: "", price: "" });
        setEditingId(null);
        setShowDialog(true);
    };

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Clothes Management</h1>
                        <p className="text-muted-foreground">Add and manage clothing types</p>
                    </div>
                    <Button onClick={handleNewClick} className="gap-2" size="lg">
                        <Plus className="w-5 h-5" />
                        Add Clothes
                    </Button>
                </div>

                {/* Grid of Clothes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clothes.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            <p>No clothes added yet. Create one to get started.</p>
                        </div>
                    ) : (
                        clothes.map(cloth => (
                            <Card key={cloth.id} className="rounded-none">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <CardTitle>{cloth.name}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Default Price</p>
                                        <p className="text-2xl font-bold">₹{cloth.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 bg-transparent"
                                            onClick={() => handleEdit(cloth)}
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 bg-transparent"
                                            onClick={() => handleDelete(cloth.id)}
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
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Clothing Type" : "Add New Clothing Type"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Clothing Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Shirt, T-Shirt, Saree"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Default Price (₹)</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                placeholder="e.g., 50"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
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
        </Layout>
    );
}
