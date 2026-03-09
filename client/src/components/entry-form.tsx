import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandList, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { generateInvoice } from "@/lib/invoice";
import { saveInvoice } from "@/lib/db";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import type { Customer, Cloth, EntryItem } from "@/lib/types";

export function EntryForm({
    onSubmit,
    onCancel,
    initialData,
}: {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    initialData?: any;
}) {
    const { customers, clothes, settings } = useStore();

    const [customerName, setCustomerName] = useState(initialData?.customerName || "");
    const [items, setItems] = useState<EntryItem[]>(initialData?.items || []);
    const [dueDate, setDueDate] = useState<Date | undefined>(
        initialData?.dueDate ? new Date(initialData.dueDate) : undefined,
    );
    const [isPaid, setIsPaid] = useState(initialData?.isPaid || false);
    const [selectedCloth, setSelectedCloth] = useState<Cloth | null>(null);
    const [quantity, setQuantity] = useState("");
    const [clothOpen, setClothOpen] = useState(false);
    const [customerOpen, setCustomerOpen] = useState(false);

    const [serviceType, setServiceType] = useState<"pickup" | "delivery">(initialData?.serviceType || "pickup");
    const [deliveryFee, setDeliveryFee] = useState(
        initialData?.deliveryFee?.toString() || settings.defaultDeliveryFee || "0",
    );
    const [discount, setDiscount] = useState(initialData?.discount?.toString() || "0");

    const handleAddItem = () => {
        if (!selectedCloth || !quantity) return;
        const newItem: EntryItem = {
            clothId: selectedCloth.id.toString(),
            clothName: selectedCloth.name,
            quantity: parseInt(quantity),
            price: selectedCloth.price * parseInt(quantity),
        };
        setItems([...items, newItem]);
        setSelectedCloth(null);
        setQuantity("");
        setClothOpen(false);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + item.price, 0);
    };

    const calculateTotalPrice = () => {
        const subtotal = calculateSubtotal();
        const d = parseFloat(discount) || 0;
        const df = parseFloat(deliveryFee) || 0;
        const discountAmount = (d / 100) * subtotal;
        const totalAfterDiscount = subtotal - discountAmount;
        const finalTotal = totalAfterDiscount + (serviceType === "delivery" ? df : 0);
        return finalTotal;
    };

    const handleSubmit = async () => {
        if (!customerName || items.length === 0 || !dueDate) {
            alert("Please fill in all required fields (Customer, Items, and Due Date)");
            return;
        }

        const trimmedName = customerName.trim();
        const customer = customers.find(c => c.name.trim().toLowerCase() === trimmedName.toLowerCase());

        if (!customer) {
            alert("Customer not found. Please select an existing customer.");
            return;
        }

        const entryId = initialData?.id || Date.now();
        const finalPrice = calculateTotalPrice();
        const entryData = {
            id: entryId,
            customerName: trimmedName,
            items,
            dueDate: dueDate.toISOString(),
            isPaid,
            price: finalPrice,
            createdAt: initialData?.createdAt || new Date().toISOString(),
            serviceType,
            deliveryFee: serviceType === "delivery" ? parseFloat(deliveryFee) || 0 : 0,
            discount: parseFloat(discount) || 0,
        };

        // If not paid, generate and save invoice in background
        if (!isPaid) {
            try {
                const pdfBlob = await generateInvoice({
                    customerName: trimmedName,
                    items,
                    total: finalPrice,
                    organizationName: settings.orgName,
                    businessPhone: settings.phone,
                    businessAddress: settings.address,
                    customerPhone: customer.phone,
                    customerAddress: customer.address,
                    bankDetails: {
                        bankName: settings.bankName,
                        accountNumber: settings.bankAccount,
                        accountName: settings.accountName,
                    },
                    deliveryFee: entryData.deliveryFee,
                    discount: entryData.discount,
                    invoiceId: entryId,
                });
                await saveInvoice(entryId, pdfBlob);
            } catch (err) {
                console.error("Failed to generate or save invoice:", err);
            }
        }

        onSubmit(entryData);
    };

    return (
        <div className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                    <PopoverTrigger className="w-full">
                        <Button variant="outline" className="w-full justify-start bg-transparent overflow-hidden">
                            <span className="truncate">{customerName ? customerName : "Select a customer..."}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search customers..." />
                            <CommandList>
                                <CommandEmpty>No customers found.</CommandEmpty>
                                <CommandGroup>
                                    {customers.map(customer => (
                                        <CommandItem
                                            key={customer.id}
                                            value={customer.name}
                                            onSelect={() => {
                                                setCustomerName(customer.name);
                                                setCustomerOpen(false);
                                            }}
                                        >
                                            {customer.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Clothes Items */}
            <div className="space-y-2">
                <Label>Items *</Label>
                <div className="space-y-3">
                    {items.length > 0 && (
                        <div className="border rounded-none p-4 space-y-2">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm">
                                        {item.quantity}x {item.clothName}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">₦{item.price.toLocaleString()}</span>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(idx)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 min-w-0">
                            <Popover open={clothOpen} onOpenChange={setClothOpen}>
                                <PopoverTrigger className="w-full">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start bg-transparent overflow-hidden"
                                    >
                                        <span className="truncate">
                                            {selectedCloth ? selectedCloth.name : "Select cloth type..."}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search clothes..." />
                                        <CommandList>
                                            <CommandEmpty>No clothes found</CommandEmpty>
                                            <CommandGroup>
                                                {clothes.map(cloth => (
                                                    <CommandItem
                                                        key={cloth.id}
                                                        value={cloth.name}
                                                        onSelect={() => {
                                                            setSelectedCloth(cloth);
                                                            setClothOpen(false);
                                                        }}
                                                    >
                                                        {cloth.name} (₦{cloth.price.toLocaleString()})
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Qty"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                className="w-20 sm:w-24"
                                min="1"
                            />
                            <Button onClick={handleAddItem} size="icon" className="shrink-0">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
                <Label>Due Date *</Label>
                <DatePicker date={dueDate} setDate={setDueDate} />
            </div>

            {/* Pricing Summary */}
            <div className="space-y-4 pt-4 border-t">
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₦{calculateSubtotal().toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Service Type</Label>
                            <Select
                                value={serviceType}
                                onValueChange={(val: any) => {
                                    setServiceType(val);
                                    if (val === "pickup") setDeliveryFee("0");
                                    else setDeliveryFee(settings.defaultDeliveryFee || "0");
                                }}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pickup">Pickup</SelectItem>
                                    <SelectItem value="delivery">Delivery</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {serviceType === "delivery" && (
                            <div className="space-y-2">
                                <Label className="text-xs">Delivery Fee (₦)</Label>
                                <Input
                                    type="number"
                                    value={deliveryFee}
                                    onChange={e => setDeliveryFee(e.target.value)}
                                    className="h-9 text-right text-xs"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs">Discount Percentage (%)</Label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={discount}
                            onChange={e => setDiscount(e.target.value)}
                            className="h-9 text-right text-xs"
                            min="0"
                            max="100"
                        />
                    </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg flex justify-between items-center border border-primary/10">
                    <span className="font-bold">Total Amount</span>
                    <span className="text-2xl font-black text-primary">₦{calculateTotalPrice().toLocaleString()}</span>
                </div>
            </div>

            {/* Payment Status */}
            <div className="flex items-center gap-2">
                <Checkbox id="paid" checked={isPaid} onCheckedChange={checked => setIsPaid(checked as boolean)} />
                <Label htmlFor="paid" className="font-normal cursor-pointer">
                    Mark as Paid
                </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={onCancel}>
                    Go back
                </Button>
                <Button onClick={handleSubmit}>Create Entry</Button>
            </div>
        </div>
    );
}
