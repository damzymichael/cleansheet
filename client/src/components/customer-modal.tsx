import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardDescription } from "@/components/ui/card";

interface CustomerModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (customer: any) => void;
    initialName?: string;
}

export function CustomerModal({ isOpen, onOpenChange, onSuccess, initialName = "" }: CustomerModalProps) {
    const [formData, setFormData] = useState({
        name: initialName,
        phone: "",
        email: "",
        address: "",
    });

    const handleAdd = () => {
        if (!formData.name) {
            alert("Please enter customer name");
            return;
        }

        const newCustomer = {
            id: Date.now(),
            ...formData,
        };

        const stored = localStorage.getItem("customers");
        const customers = stored ? JSON.parse(stored) : [];
        const updated = [...customers, newCustomer];
        localStorage.setItem("customers", JSON.stringify(updated));

        onSuccess(newCustomer);
        setFormData({ name: "", phone: "", email: "", address: "" });
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">New Customer Registration</DialogTitle>
                    <CardDescription>Register this customer before saving their entry.</CardDescription>
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
                        <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                            Cancel
                        </Button>
                        <Button onClick={handleAdd} className="px-8 shadow-sm">
                            Register Customer
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
