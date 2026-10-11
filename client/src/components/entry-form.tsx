import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Check, Search } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import type { Cloth, ServerCustomer, ServerItem, ApiResponse, PaginatedData } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { generateInvoice } from "@/lib/invoice";
import { saveInvoice } from "@/lib/db";

// Item schema for adding a clothing item to entry
const entryItemSchema = z.object({
    clothId: z.string().min(1, "Please select an item"),
    clothName: z.string().min(1, "Cloth name is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    wash: z.boolean(),
    iron: z.boolean(),
    starch: z.boolean(),
    unitPrice: z.number().min(0),
}).refine(data => data.wash || data.iron || data.starch, {
    message: "Select at least one service (wash, iron, or starch)",
    path: ["wash"],
});

export type AddedEntryItem = {
    clothId: string;
    clothName: string;
    quantity: number;
    wash: boolean;
    iron: boolean;
    starch: boolean;
    unitPrice: number;
    totalPrice: number;
};

// Form schema for the entire entry
const entryFormSchema = z.object({
    customerId: z.string().optional(),
    customerName: z.string().min(1, "Customer is required"),
    dueDate: z.date({
        error: "Due date is required",
    }),
    serviceType: z.enum(["pickup", "delivery"]),
    deliveryFee: z.coerce.number().min(0, "Delivery fee cannot be negative"),
    discount: z.coerce.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%"),
    isPaid: z.boolean(),
});

type EntryFormValues = z.infer<typeof entryFormSchema>;

export function EntryForm({
    onSubmitSuccess,
    onCancel,
    initialData,
}: {
    onSubmitSuccess?: () => void;
    onCancel: () => void;
    initialData?: any;
}) {
    const queryClient = useQueryClient();
    const { settings } = useStore();

    // 1. Fetch settings / default delivery fee from settings endpoint
    const { data: businessData } = useQuery({
        queryKey: ["business"],
        queryFn: async () => {
            const res = await api.get<{
                success: boolean;
                data: {
                    name?: string;
                    phone_number?: string;
                    address?: string;
                    bank_name?: string;
                    account_number?: string;
                    account_name?: string;
                    default_delivery_price?: number;
                };
            }>("/business");
            return res.data.data;
        },
    });

    const defaultDeliveryFee = businessData?.default_delivery_price ?? (Number(settings.defaultDeliveryFee) || 0);

    // 2. React Hook Form Setup
    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<z.input<typeof entryFormSchema>, any, EntryFormValues>({
        resolver: zodResolver(entryFormSchema),
        defaultValues: {
            customerId: initialData?.customerId || "",
            customerName: initialData?.customerName || "",
            dueDate: initialData?.dueDate ? new Date(initialData.dueDate) : undefined,
            serviceType: initialData?.serviceType || "pickup",
            deliveryFee: initialData?.deliveryFee !== undefined ? initialData.deliveryFee : 0,
            discount: initialData?.discount !== undefined ? initialData.discount : 0,
            isPaid: initialData?.isPaid || false,
        },
    });

    const watchedServiceType = watch("serviceType");
    const watchedDeliveryFee = watch("deliveryFee") || 0;
    const watchedDiscount = watch("discount") || 0;
    const watchedCustomerName = watch("customerName");

    // Update delivery fee when default delivery fee changes or serviceType toggles
    useEffect(() => {
        if (!initialData) {
            if (watchedServiceType === "delivery") {
                setValue("deliveryFee", defaultDeliveryFee);
            } else {
                setValue("deliveryFee", 0);
            }
        }
    }, [watchedServiceType, defaultDeliveryFee, initialData, setValue]);

    // 3. Customer Autocomplete Search
    const [customerInput, setCustomerInput] = useState(initialData?.customerName || "");
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const debouncedCustomerSearch = useDebounce(customerInput, 300);
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    // Query 5-6 customers based on search term
    const { data: customersResponse, isLoading: isLoadingCustomers } = useQuery<PaginatedData<ServerCustomer>>({
        queryKey: ["customers-dropdown", debouncedCustomerSearch],
        queryFn: async () => {
            const { data } = await api.get<ApiResponse<PaginatedData<ServerCustomer>>>("/customers", {
                params: {
                    page: 1,
                    limit: 6,
                    search: debouncedCustomerSearch ? debouncedCustomerSearch.trim() : undefined,
                },
            });
            return data.data;
        },
    });

    const serverCustomers = customersResponse?.items || [];
    const displayCustomerSuggestions = serverCustomers;

    // Close customer suggestions dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
                setIsCustomerModalOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectCustomer = (customer: { id: string; name: string }) => {
        setCustomerInput(customer.name);
        setValue("customerName", customer.name, { shouldValidate: true });
        setValue("customerId", customer.id, { shouldValidate: true });
        setIsCustomerModalOpen(false);
    };

    // 4. Clothes Autocomplete & Selection
    const [clothInput, setClothInput] = useState("");
    const [isClothModalOpen, setIsClothModalOpen] = useState(false);
    const [selectedCloth, setSelectedCloth] = useState<ServerItem | Cloth | null>(null);
    const debouncedClothSearch = useDebounce(clothInput, 300);
    const clothDropdownRef = useRef<HTMLDivElement>(null);

    const { data: clothesResponse, isLoading: isLoadingClothes } = useQuery<PaginatedData<ServerItem>>({
        queryKey: ["clothes-dropdown", debouncedClothSearch],
        queryFn: async () => {
            const { data } = await api.get<ApiResponse<PaginatedData<ServerItem>>>("/items", {
                params: {
                    page: 1,
                    limit: 6,
                    search: debouncedClothSearch ? debouncedClothSearch.trim() : undefined,
                },
            });
            return data.data;
        },
    });

    const serverClothes = clothesResponse?.items || [];
    const displayClothSuggestions = serverClothes;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (clothDropdownRef.current && !clothDropdownRef.current.contains(event.target as Node)) {
                setIsClothModalOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectCloth = (cloth: ServerItem | any) => {
        setSelectedCloth(cloth);
        setClothInput(cloth.name);
        setIsClothModalOpen(false);
        // Default wash service to checked if wash_price > 0
        const washPrice = cloth.wash_price ?? cloth.washPrice ?? 0;
        setWashChecked(washPrice > 0);
        setIronChecked(false);
        setStarchChecked(false);
    };

    // Services selection for the current item
    const [washChecked, setWashChecked] = useState(true);
    const [ironChecked, setIronChecked] = useState(false);
    const [starchChecked, setStarchChecked] = useState(false);
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemError, setItemError] = useState<string | null>(null);

    // Compute unit price for selected cloth based on options
    const washPrice = selectedCloth ? (Number((selectedCloth as any).wash_price ?? (selectedCloth as any).washPrice) || 0) : 0;
    const ironPrice = selectedCloth ? (Number((selectedCloth as any).iron_price ?? (selectedCloth as any).ironingPrice) || 0) : 0;
    const starchPrice = selectedCloth ? (Number((selectedCloth as any).starch_price ?? (selectedCloth as any).starchPrice) || 0) : 0;

    const currentItemUnitPrice = 
        (washChecked ? washPrice : 0) + 
        (ironChecked ? ironPrice : 0) + 
        (starchChecked ? starchPrice : 0);

    // 5. Added Items List
    const [addedItems, setAddedItems] = useState<AddedEntryItem[]>(
        initialData?.items?.map((item: any) => ({
            clothId: item.clothId || item.item_id || "",
            clothName: item.clothName || item.cloth_name || "",
            quantity: item.quantity || 1,
            wash: item.wash !== undefined ? item.wash : true,
            iron: item.iron || false,
            starch: item.starch || false,
            unitPrice: item.unitPrice || (item.price && item.quantity ? item.price / item.quantity : 0),
            totalPrice: item.price || 0,
        })) || []
    );

    const handleAddItem = () => {
        setItemError(null);
        if (!selectedCloth) {
            setItemError("Please select a clothing item");
            return;
        }

        const candidate = {
            clothId: String(selectedCloth.id),
            clothName: selectedCloth.name,
            quantity: Number(itemQuantity) || 1,
            wash: washChecked,
            iron: ironChecked,
            starch: starchChecked,
            unitPrice: currentItemUnitPrice,
        };

        const result = entryItemSchema.safeParse(candidate);
        if (!result.success) {
            const firstErr = result.error.issues[0]?.message || "Invalid item";
            setItemError(firstErr);
            return;
        }

        const newItem: AddedEntryItem = {
            clothId: candidate.clothId,
            clothName: candidate.clothName,
            quantity: candidate.quantity,
            wash: candidate.wash,
            iron: candidate.iron,
            starch: candidate.starch,
            unitPrice: currentItemUnitPrice,
            totalPrice: currentItemUnitPrice * candidate.quantity,
        };

        setAddedItems(prev => [...prev, newItem]);
        // Reset item input
        setSelectedCloth(null);
        setClothInput("");
        setItemQuantity(1);
        setWashChecked(true);
        setIronChecked(false);
        setStarchChecked(false);
        setItemError(null);
    };

    const handleRemoveItem = (index: number) => {
        setAddedItems(prev => prev.filter((_, i) => i !== index));
    };

    // Calculate totals
    const subtotal = addedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = ((Number(watchedDiscount) || 0) / 100) * subtotal;
    const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const finalTotal = totalAfterDiscount + (watchedServiceType === "delivery" ? (Number(watchedDeliveryFee) || 0) : 0);

    // 6. TanStack Mutation: Create Entry in Database
    const createEntryMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post("/entries", payload);
            return data;
        },
        onSuccess: async (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["entries"] });
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Entry recorded successfully!");

            // If not paid, generate and save invoice in background (IndexedDB)
            if (!variables.paid) {
                try {
                    const pdfBlob = await generateInvoice({
                        customerName: variables.customer_name,
                        items: addedItems.map(item => ({
                            clothName: item.clothName,
                            quantity: item.quantity,
                            price: item.totalPrice,
                        })),
                        total: finalTotal,
                        organizationName: businessData?.name || settings.orgName,
                        businessPhone: businessData?.phone_number || settings.phone,
                        businessAddress: businessData?.address || settings.address,
                        bankDetails: {
                            bankName: businessData?.bank_name || settings.bankName,
                            accountNumber: businessData?.account_number || settings.bankAccount,
                            accountName: businessData?.account_name || settings.accountName,
                        },
                        deliveryFee: variables.delivery_fee,
                        discount: variables.discount_price,
                        invoiceId: data?.data?.id || Date.now(),
                    });
                    if (data?.data?.id) {
                        await saveInvoice(data.data.id, pdfBlob);
                    }
                } catch (err) {
                    console.error("Failed to generate background invoice:", err);
                }
            }

            if (onSubmitSuccess) {
                onSubmitSuccess();
            }
        },
        onError: (error) => {
            console.error("Create entry error:", error);
            if (error instanceof AxiosError) {
                toast.error(error.response?.data?.message || error.response?.data?.detail || "Failed to create entry");
                return;
            }
            toast.error("An error occurred while creating entry");
        },
    });

    const onSubmit = (formData: EntryFormValues) => {
        if (addedItems.length === 0) {
            toast.error("Please add at least one clothing item");
            return;
        }

        const payload = {
            customer_id: formData.customerId ? formData.customerId : undefined,
            customer_name: formData.customerName.trim(),
            items: addedItems.map(item => ({
                cloth_id: item.clothId,
                cloth_name: item.clothName,
                quantity: item.quantity,
                wash: item.wash,
                iron: item.iron,
                starch: item.starch,
                price: item.totalPrice,
            })),
            due_date: formData.dueDate ? formData.dueDate.toISOString() : null,
            collection_mode: formData.serviceType,
            delivery_fee: formData.serviceType === "delivery" ? Number(formData.deliveryFee) || 0 : 0,
            discount_price: Number(formData.discount) || 0,
            paid: formData.isPaid,
        };

        createEntryMutation.mutate(payload);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-sans">
            {/* Customer Input & Autocomplete */}
            <div className="space-y-2 relative" ref={customerDropdownRef}>
                <Label htmlFor="customer-input">Customer Name *</Label>
                <div className="relative">
                    <Input
                        id="customer-input"
                        placeholder="Type to search customer..."
                        value={customerInput}
                        autoComplete="off"
                        onChange={(e) => {
                            setCustomerInput(e.target.value);
                            setValue("customerName", e.target.value, { shouldValidate: true });
                            setValue("customerId", "");
                            setIsCustomerModalOpen(true);
                        }}
                        onFocus={() => setIsCustomerModalOpen(true)}
                    />
                    {isLoadingCustomers && (
                        <div className="absolute right-3 top-2.5 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    )}
                </div>
                {errors.customerName && (
                    <p className="text-sm text-destructive">{errors.customerName.message}</p>
                )}

                {/* Dropdown Modal Below Input */}
                {isCustomerModalOpen && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                        <div className="p-2 border-b bg-muted/20 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                            <span>Suggestions (Select a customer)</span>
                            <Search className="w-3.5 h-3.5" />
                        </div>
                        {isLoadingCustomers ? (
                            <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Searching customers...</span>
                            </div>
                        ) : displayCustomerSuggestions.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {customerInput ? `No customer found matching "${customerInput}"` : "No customers available"}
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {displayCustomerSuggestions.map((cust) => (
                                    <div
                                        key={cust.id}
                                        onClick={() => handleSelectCustomer(cust)}
                                        className="p-2.5 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{cust.name}</p>
                                            {cust.phone_number && (
                                                <p className="text-xs text-muted-foreground">{cust.phone_number}</p>
                                            )}
                                        </div>
                                        {watchedCustomerName === cust.name && (
                                            <Check className="w-4 h-4 text-primary" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Clothes Items Selection Section */}
            <div className="space-y-4 pt-2 border-t">
                <div>
                    <Label className="text-base font-semibold">Add Items & Quantities</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Search clothes, choose services (wash, iron, starch), set quantity and add to order
                    </p>
                </div>

                {/* Display Added Items Table/List */}
                {addedItems.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden divide-y divide-border bg-card">
                        <div className="bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground grid grid-cols-12 gap-2">
                            <span className="col-span-5">Item</span>
                            <span className="col-span-4">Services</span>
                            <span className="col-span-2 text-right">Price</span>
                            <span className="col-span-1 text-center"></span>
                        </div>
                        {addedItems.map((item, idx) => (
                            <div key={idx} className="px-3 py-2.5 grid grid-cols-12 gap-2 items-center text-sm">
                                <div className="col-span-5 min-w-0">
                                    <span className="font-semibold">{item.quantity}x</span>{" "}
                                    <span className="truncate">{item.clothName}</span>
                                </div>
                                <div className="col-span-4 flex flex-wrap gap-1 items-center">
                                    {item.wash && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Wash</Badge>}
                                    {item.iron && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Iron</Badge>}
                                    {item.starch && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Starch</Badge>}
                                </div>
                                <div className="col-span-2 text-right font-medium">
                                    ₦{item.totalPrice.toLocaleString()}
                                </div>
                                <div className="col-span-1 text-center">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveItem(idx)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Item Row with Autocomplete & Radio-styled multiple checkboxes */}
                <div className="p-3.5 bg-muted/20 border border-border rounded-lg space-y-3.5">
                    {/* Cloth input with dropdown */}
                    <div className="relative" ref={clothDropdownRef}>
                        <Label htmlFor="cloth-search-input" className="text-xs font-medium">Clothing Item *</Label>
                        <div className="relative mt-1">
                            <Input
                                id="cloth-search-input"
                                placeholder="Type to search clothing item..."
                                value={clothInput}
                                autoComplete="off"
                                onChange={(e) => {
                                    setClothInput(e.target.value);
                                    setSelectedCloth(null);
                                    setIsClothModalOpen(true);
                                }}
                                onFocus={() => setIsClothModalOpen(true)}
                            />
                            {isLoadingClothes && (
                                <div className="absolute right-3 top-2.5 text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Clothes dropdown modal */}
                        {isClothModalOpen && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                                <div className="p-2 border-b bg-muted/20 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                                    <span>Select a clothing item</span>
                                    <Search className="w-3.5 h-3.5" />
                                </div>
                                {isLoadingClothes ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Searching clothes...</span>
                                    </div>
                                ) : displayClothSuggestions.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        {clothInput ? `No clothing items found matching "${clothInput}"` : "No clothing items available"}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/50">
                                        {displayClothSuggestions.map((cloth) => (
                                            <div
                                                key={cloth.id}
                                                onClick={() => handleSelectCloth(cloth)}
                                                className="p-2.5 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">{cloth.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Wash: ₦{Number((cloth as any).wash_price ?? (cloth as any).washPrice ?? 0).toLocaleString()} | 
                                                        Iron: ₦{Number((cloth as any).iron_price ?? (cloth as any).ironingPrice ?? 0).toLocaleString()} | 
                                                        Starch: ₦{Number((cloth as any).starch_price ?? (cloth as any).starchPrice ?? 0).toLocaleString()}
                                                    </p>
                                                </div>
                                                {selectedCloth?.id === cloth.id && (
                                                    <Check className="w-4 h-4 text-primary" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Radio-styled multi-choice for Wash, Iron, Starch */}
                    <div>
                        <Label className="text-xs font-medium">Select Services *</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                            {/* Wash option */}
                            <label
                                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                    washPrice <= 0
                                        ? "opacity-50 cursor-not-allowed bg-muted/40 border-dashed"
                                        : washChecked
                                        ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                                        : "border-border hover:bg-accent/40"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                            washChecked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                        }`}
                                    >
                                        {washChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={washChecked}
                                        disabled={washPrice <= 0}
                                        onChange={(e) => setWashChecked(e.target.checked)}
                                    />
                                    <span className="font-medium">Wash</span>
                                </div>
                                <span className="font-semibold text-muted-foreground">
                                    {washPrice > 0 ? `₦${washPrice.toLocaleString()}` : "No price added"}
                                </span>
                            </label>

                            {/* Iron option */}
                            <label
                                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                    ironPrice <= 0
                                        ? "opacity-50 cursor-not-allowed bg-muted/40 border-dashed"
                                        : ironChecked
                                        ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                                        : "border-border hover:bg-accent/40"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                            ironChecked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                        }`}
                                    >
                                        {ironChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={ironChecked}
                                        disabled={ironPrice <= 0}
                                        onChange={(e) => setIronChecked(e.target.checked)}
                                    />
                                    <span className="font-medium">Iron</span>
                                </div>
                                <span className="font-semibold text-muted-foreground">
                                    {ironPrice > 0 ? `₦${ironPrice.toLocaleString()}` : "No price added"}
                                </span>
                            </label>

                            {/* Starch option */}
                            <label
                                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                    starchPrice <= 0
                                        ? "opacity-50 cursor-not-allowed bg-muted/40 border-dashed"
                                        : starchChecked
                                        ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                                        : "border-border hover:bg-accent/40"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                            starchChecked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                        }`}
                                    >
                                        {starchChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={starchChecked}
                                        disabled={starchPrice <= 0}
                                        onChange={(e) => setStarchChecked(e.target.checked)}
                                    />
                                    <span className="font-medium">Starch</span>
                                </div>
                                <span className="font-semibold text-muted-foreground">
                                    {starchPrice > 0 ? `₦${starchPrice.toLocaleString()}` : "No price added"}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Quantity & Add Item Button */}
                    <div className="flex items-end gap-3 pt-1">
                        <div className="w-28 space-y-1">
                            <Label htmlFor="item-qty" className="text-xs">Quantity</Label>
                            <Input
                                id="item-qty"
                                type="number"
                                min="1"
                                value={itemQuantity}
                                onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>
                        <div className="flex-1 pb-2 text-xs text-muted-foreground">
                            Unit Price: <span className="font-bold text-foreground">₦{currentItemUnitPrice.toLocaleString()}</span> | 
                            Line Total: <span className="font-bold text-primary">₦{(currentItemUnitPrice * itemQuantity).toLocaleString()}</span>
                        </div>
                        <Button
                            type="button"
                            onClick={handleAddItem}
                            className="gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            Add Item
                        </Button>
                    </div>

                    {itemError && (
                        <p className="text-xs text-destructive font-medium">{itemError}</p>
                    )}
                </div>
            </div>

            {/* Due Date: Past dates disabled */}
            <div className="space-y-2">
                <Label>Due Date *</Label>
                <Controller
                    control={control}
                    name="dueDate"
                    render={({ field }) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return (
                            <DatePicker
                                date={field.value}
                                setDate={field.onChange}
                                disabled={(date: Date) => date < today}
                            />
                        );
                    }}
                />
                {errors.dueDate && (
                    <p className="text-sm text-destructive">{errors.dueDate.message}</p>
                )}
            </div>

            {/* Pricing Summary */}
            <div className="space-y-4 pt-4 border-t">
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">₦{subtotal.toLocaleString()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Service Type</Label>
                            <Controller
                                control={control}
                                name="serviceType"
                                render={({ field }) => (
                                    <Select
                                        value={field.value}
                                        onValueChange={(val: any) => field.onChange(val)}
                                    >
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pickup">Pickup</SelectItem>
                                            <SelectItem value="delivery">Delivery</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {watchedServiceType === "delivery" && (
                            <div className="space-y-1.5">
                                <Label className="text-xs">Delivery Fee (₦)</Label>
                                <Input
                                    type="number"
                                    step="1"
                                    {...register("deliveryFee")}
                                    className="h-9 text-right text-xs"
                                />
                                {errors.deliveryFee && (
                                    <p className="text-xs text-destructive">{errors.deliveryFee.message}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Discount Percentage (%)</Label>
                        <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="100"
                            {...register("discount")}
                            className="h-9 text-right text-xs"
                        />
                        {errors.discount && (
                            <p className="text-xs text-destructive">{errors.discount.message}</p>
                        )}
                    </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-lg flex justify-between items-center border border-primary/10">
                    <span className="font-bold">Total Amount</span>
                    <span className="text-2xl font-black text-primary">₦{finalTotal.toLocaleString()}</span>
                </div>
            </div>

            {/* Payment Status */}
            <div className="flex items-center gap-2">
                <Controller
                    control={control}
                    name="isPaid"
                    render={({ field }) => (
                        <Checkbox
                            id="paid"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
                <Label htmlFor="paid" className="font-normal cursor-pointer text-sm">
                    Mark as Paid
                </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" type="button" onClick={onCancel}>
                    Go back
                </Button>
                <Button type="submit" disabled={createEntryMutation.isPending}>
                    {createEntryMutation.isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating Entry...
                        </>
                    ) : (
                        "Create Entry"
                    )}
                </Button>
            </div>
        </form>
    );
}
