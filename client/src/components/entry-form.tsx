import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandList, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface Item {
    clothId: string;
    clothName: string;
    quantity: number;
    price: number;
}

export function EntryForm({
    onSubmit,
    onCancel,
    initialData,
}: {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    initialData?: any;
}) {
    const [customerName, setCustomerName] = useState(initialData?.customerName || "");
    const [customerOpen, setCustomerOpen] = useState(false);
    const [items, setItems] = useState<Item[]>(initialData?.items || []);
    const [dueDate, setDueDate] = useState<Date | undefined>(
        initialData?.dueDate ? new Date(initialData.dueDate) : undefined,
    );
    const [isPaid, setIsPaid] = useState(initialData?.isPaid || false);
    const [price, setPrice] = useState(initialData?.price || "");
    const [selectedCloth, setSelectedCloth] = useState<any>(null);
    const [quantity, setQuantity] = useState("");
    const [clothOpen, setClothOpen] = useState(false);

    // Get stored data
    const customers = useMemo(() => {
        const stored = localStorage.getItem("customers");
        return stored ? JSON.parse(stored) : [];
    }, []);

    const clothes = useMemo(() => {
        const stored = localStorage.getItem("clothes");
        return stored ? JSON.parse(stored) : [];
    }, []);

    const handleAddItem = () => {
        if (!selectedCloth || !quantity) return;
        const newItem: Item = {
            clothId: selectedCloth.id,
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

    const calculateTotalPrice = () => {
        const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
        return +price || itemsTotal;
    };

    const handleSubmit = () => {
        if (!customerName || items.length === 0 || !dueDate) {
            alert("Please fill in all required fields (Customer, Items, and Due Date)");
            return;
        }
        onSubmit({
            customerName,
            items,
            dueDate: dueDate.toISOString(),
            isPaid,
            price: parseFloat(calculateTotalPrice().toString()),
        });
    };

    return (
        <div className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-2">
                <Label>Customer *</Label>
                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                    <PopoverTrigger className="w-full">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                            {customerName || "Select or type customer name..."}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                        <Command>
                            <CommandInput
                                placeholder="Search customers..."
                                value={customerName}
                                onValueChange={setCustomerName}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    {customerName && (
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start"
                                            onClick={() => {
                                                setCustomerOpen(false);
                                            }}
                                        >
                                            Use "{customerName}"
                                        </Button>
                                    )}
                                </CommandEmpty>
                                <CommandGroup>
                                    {customers.map((customer: any) => (
                                        <CommandItem
                                            key={customer.id}
                                            value={customer.name}
                                            onSelect={value => {
                                                setCustomerName(value);
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
                                        <span className="text-sm font-medium">₦{item.price}</span>
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
                                                {clothes.map((cloth: any) => (
                                                    <CommandItem
                                                        key={cloth.id}
                                                        value={cloth.name}
                                                        onSelect={() => {
                                                            setSelectedCloth(cloth);
                                                            setClothOpen(false);
                                                        }}
                                                    >
                                                        {cloth.name} (₦{cloth.price})
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

            {/* Price */}
            <div className="space-y-2">
                <Label>Price (Auto-calculated)</Label>
                <Input
                    type="number"
                    placeholder="Override price"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="text-right"
                />
                <p className="text-xs text-muted-foreground">Total: ₦{(calculateTotalPrice() as number).toFixed(2)}</p>
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
