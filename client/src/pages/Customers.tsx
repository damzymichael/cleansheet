import { useState } from "react";
import { Plus, Trash2, Edit2, User, Phone, Search, ChevronRight, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { useStore } from "@/store/useStore";
import type { Customer } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const customerSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be at most 50 characters"),
    phone: z.string().min(10, "Phone number must be at least 10 digits").max(14, "Phone number must be at most 14 digits"),
    address: z.string().min(5, "Address must be at least 5 characters").max(200, "Address must be at most 200 characters")
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function Customers() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { 
        customers: localCustomers, 
        entries, 
        addCustomer: addLocalCustomer, 
        updateCustomer: updateLocalCustomer, 
        deleteCustomer: deleteLocalCustomer, 
        customerDataMigrated, 
        setCustomerDataMigrated 
    } = useStore();
    
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Delete Confirmation Logic
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<string | number | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: "",
            phone: "",
            address: "",
        }
    });

    // TanStack Query: Fetch Customers
    const { data: serverCustomers = [], isLoading: isLoadingCustomers } = useQuery({
        queryKey: ["customers"],
        queryFn: async () => {
            const { data } = await api.get("/customers");
            return data;
        },
        enabled: customerDataMigrated, // Only fetch from server if migrated
    });

    // Determine which customers to display
    const displayCustomers = customerDataMigrated 
        ? serverCustomers.map((c: any) => ({ ...c, phone: c.phone_number, id: c.id })) 
        : localCustomers;

    // TanStack Mutation: Bulk Migrate
    const migrateMutation = useMutation({
        mutationFn: async (customersToMigrate: Customer[]) => {
            const payload = customersToMigrate.map(c => ({
                name: c.name,
                phone_number: c.phone,
                address: c.address,
                id_in_browser: c.id
            }));
            const { data } = await api.post("/customers/bulk", payload);
            return data;
        },
        onSuccess: () => {
            setCustomerDataMigrated(true);
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Data migrated successfully!");
        },
        onError: (error) => {
            console.error("Migration error:", error);
            toast.error("Failed to migrate data");
        }
    });

    // TanStack Mutation: Create Customer
    const createCustomerMutation = useMutation({
        mutationFn: async (newCustomer: CustomerFormValues) => {
            const payload = {
                name: newCustomer.name,
                phone_number: newCustomer.phone,
                address: newCustomer.address,
            };
            const { data } = await api.post<{data: null; message: string; success: boolean}>("/customers", payload);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success(data.message);
            setShowDialog(false);
            reset();
        },
        onError: (error) => {
            console.error("Create customer error:", error);
            if (error instanceof AxiosError) {
                const _error: AxiosError<{ message: string }> = error
                toast.error(_error.response?.data.message)
                return
            }
            toast.error("Error occured while registering customer")
        }
    });

    // TanStack Mutation: Update Customer
    const updateCustomerMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string | number, data: CustomerFormValues }) => {
            const payload = {
                name: data.name,
                phone_number: data.phone,
                address: data.address,
            };
            const response = await api.put<{data: null; message: string; success: boolean}>(`/customers/${id}`, payload);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success(data.message);
            setShowDialog(false);
            reset();
        },
        onError: (error) => {
            console.error("Update customer error:", error);
            if (error instanceof AxiosError) {
                const _error: AxiosError<{ message: string }> = error
                toast.error(_error.response?.data.message)
                return
            }
            toast.error("Error occured while updating customer")
        }
    });

    // TanStack Mutation: Delete Customer
    const deleteCustomerMutation = useMutation({
        mutationFn: async (id: string | number) => {
            const { data } = await api.delete<{data: null; message: string; success: boolean}>(`/customers/${id}`);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            toast.success(data.message);
            setIsDeleteDialogOpen(false);
            setCustomerToDelete(null);
        },
        onError: (error) => {
            console.error("Delete customer error:", error);
            if (error instanceof AxiosError) {
                const _error: AxiosError<{ message: string }> = error
                toast.error(_error.response?.data.message)
                return
            }
            toast.error("Error occured while deleting customer")
        }
    });


    const handleMigrateClick = () => {
        migrateMutation.mutate(localCustomers);
    };

    const onSubmit = (data: CustomerFormValues) => {
        if (customerDataMigrated) {
            if (editingId) {
                updateCustomerMutation.mutate({ id: editingId, data });
            } else {
                createCustomerMutation.mutate(data);
            }
        } else {
            // Local fallback
            if (editingId) {
                updateLocalCustomer(editingId as number, data);
            } else {
                const newCustomer: Customer = {
                    id: Date.now(),
                    ...data,
                };
                addLocalCustomer(newCustomer);
            }
            setShowDialog(false);
            reset();
        }
    };

    const handleEdit = (customer: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setValue("name", customer.name);
        setValue("phone", customer.phone || "");
        setValue("address", customer.address || "");
        setEditingId(customer.id);
        setShowDialog(true);
    };

    const handleDeleteClick = (id: string | number, e: React.MouseEvent) => {
        e.stopPropagation();
        setCustomerToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (customerToDelete !== null) {
            if (customerDataMigrated) {
                deleteCustomerMutation.mutate(customerToDelete);
            } else {
                deleteLocalCustomer(customerToDelete as number);
                setIsDeleteDialogOpen(false);
                setCustomerToDelete(null);
            }
        }
    };

    const handleNewClick = () => {
        reset();
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

    const filteredCustomers = displayCustomers.filter(
        (c: any) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm)),
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
                    <div className="flex gap-2 w-full sm:w-auto">
                        {!customerDataMigrated && (
                            <Button 
                                onClick={handleMigrateClick} 
                                className="gap-2" 
                                size="lg" 
                                variant="outline"
                                disabled={migrateMutation.isPending || localCustomers.length === 0}
                            >
                                <UploadCloud className="w-5 h-5" />
                                {migrateMutation.isPending ? "Migrating..." : "Migrate Data"}
                            </Button>
                        )}
                        <Button onClick={handleNewClick} className="gap-2" size="lg">
                            <Plus className="w-5 h-5" />
                            Add Customer
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end font-sans">
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
                    {isLoadingCustomers && customerDataMigrated ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <p className="text-lg font-sans">Loading customers...</p>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                            <p className="text-lg font-sans">No customers found</p>
                        </div>
                    ) : (
                        filteredCustomers.map((customer: any) => {
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
                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-sans">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        <span>{customer.phone}</span>
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
                    description={`Are you sure you want to delete ${displayCustomers.find((c: any) => c.id === customerToDelete)?.name || "this customer"}? This will remove all their information and history.`}
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
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-semibold">
                                Full Name *
                            </Label>
                            <Input
                                id="name"
                                placeholder="Enter full name"
                                {...register("name")}
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-semibold">
                                Phone Number
                            </Label>
                            <Input
                                id="phone"
                                placeholder="080 123 4567"
                                {...register("phone")}
                            />
                            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-sm font-semibold">
                                Residential Address
                            </Label>
                            <Input
                                id="address"
                                placeholder="Enter home address"
                                {...register("address")}
                            />
                            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t mt-6">
                            <Button variant="outline" onClick={() => setShowDialog(false)} type="button">
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                className="px-8 shadow-sm"
                                disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending}
                            >
                                {(createCustomerMutation.isPending || updateCustomerMutation.isPending) ? "Saving..." : (editingId ? "Save Changes" : "Register Customer")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
