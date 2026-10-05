import { useState } from "react";
import { Plus, Trash2, Edit2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Layout from "@/components/layout";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { useStore } from "@/store/useStore";
import type { Cloth } from "@/lib/types";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { AxiosError } from "axios";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const clothSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
    washPrice: z.number({ message: "Must be a number" }).min(0, "Wash price cannot be negative"),
    ironingPrice: z.number({ message: "Must be a number" }).min(0, "Ironing price cannot be negative"),
    starchPrice: z.number({ message: "Must be a number" }).min(0, "Starch price cannot be negative"),
});

type ClothFormValues = z.infer<typeof clothSchema>;

type ItemsData = {
    success: boolean;
    message: string;
    data: {
        id: string;
        name: string;
        wash_price: number;
        iron_price: number;
        starch_price: number;
    }[];
};

export default function Clothes() {
    const queryClient = useQueryClient();
    const { 
        clothes: localClothes, 
        addCloth: addLocalCloth, 
        updateCloth: updateLocalCloth, 
        deleteCloth: deleteLocalCloth,
        clothesMigrated
    } = useStore();
    
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);

    // Delete Confirmation Logic
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [clothToDelete, setClothToDelete] = useState<string | number | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm<ClothFormValues>({
        resolver: zodResolver(clothSchema),
        defaultValues: {
            name: "",
            washPrice: 0,
            ironingPrice: 0,
            starchPrice: 0,
        }
    });

    // TanStack Query: Fetch Clothes (Items)
    const { data: serverClothes = [], isLoading: isLoadingClothes } = useQuery({
        queryKey: ["items"],
        queryFn: async () => {
            const { data } = await api.get<ItemsData>("/items");
            return data.data;
        },
        enabled: clothesMigrated, // Only fetch from server if migrated
    });

    // Determine which clothes to display
    const displayClothes = clothesMigrated 
        ? serverClothes.map((c: any) => ({
            id: c.id,
            name: c.name,
            washPrice: c.wash_price,
            ironingPrice: c.iron_price,
            starchPrice: c.starch_price
        })) 
        : localClothes.map(c => ({
            id: c.id,
            name: c.name,
            washPrice: c.washPrice ?? c.price ?? 0,
            ironingPrice: c.ironingPrice ?? 0,
            starchPrice: c.starchPrice ?? 0,
        }));

    // TanStack Mutation: Bulk Migrate
    const migrateMutation = useMutation({
        mutationFn: async (clothesToMigrate: any[]) => {
            const payload = clothesToMigrate.map(c => ({
                name: c.name,
                wash_price: c.washPrice ?? c.price ?? 0,
                iron_price: c.ironingPrice ?? 0,
                starch_price: c.starchPrice ?? 0,
                id_in_browser: typeof c.id === 'number' ? c.id : null
            }));
            const { data } = await api.post("/items/bulk", payload);
            return data;
        },
        onSuccess: () => {
            console.log("Success")
            useStore.setState({ clothesMigrated: true });
            queryClient.invalidateQueries({ queryKey: ["items"] });
            toast.success("Clothes data migrated successfully!");
            // Todo Update in local storage
        },
        onError: (error) => {
            console.error("Migration error:", error);
            toast.error("Failed to migrate clothes data");
        }
    });

    // TanStack Mutation: Create Cloth (Item)
    const createClothMutation = useMutation({
        mutationFn: async (newCloth: ClothFormValues) => {
            const payload = {
                name: newCloth.name,
                wash_price: newCloth.washPrice,
                iron_price: newCloth.ironingPrice,
                starch_price: newCloth.starchPrice,
            };
            const { data } = await api.post<{data: null; message: string; success: boolean}>("/items", payload);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["items"] });
            toast.success(data.message);
            setShowDialog(false);
            reset();
        },
        onError: (error) => {
            console.error("Create cloth error:", error);
            if (error instanceof AxiosError) {
                const _error: AxiosError<{ message: string }> = error;
                toast.error(_error.response?.data.message);
                return;
            }
            toast.error("Error occurred while adding cloth");
        }
    });

    // TanStack Mutation: Update Cloth (Item)
    const updateClothMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string | number, data: ClothFormValues }) => {
            const payload = {
                name: data.name,
                wash_price: data.washPrice,
                iron_price: data.ironingPrice,
                starch_price: data.starchPrice,
            };
            const response = await api.put<{data: null; message: string; success: boolean}>(`/items/${id}`, payload);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["items"] });
            toast.success(data.message);
            setShowDialog(false);
            reset();
        },
        onError: (error) => {
            console.error("Update cloth error:", error);
            if (error instanceof AxiosError) {
                const _error: AxiosError<{ message: string }> = error;
                toast.error(_error.response?.data.message);
                return;
            }
            toast.error("Error occurred while updating cloth");
        }
    });

    // TanStack Mutation: Delete Cloth (Item)
    const deleteClothMutation = useMutation({
        mutationFn: async (id: string | number) => {
            const { data } = await api.delete<{data: null; message: string; success: boolean}>(`/items/${id}`);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["items"] });
            toast.success(data.message);
            setIsDeleteDialogOpen(false);
            setClothToDelete(null);
        },
        onError: (error) => {
            console.error("Delete cloth error:", error);
            if (error instanceof AxiosError) {
                const _error: AxiosError<{ message: string }> = error;
                toast.error(_error.response?.data.message);
                return;
            }
            toast.error("Error occurred while deleting cloth");
        }
    });

    const handleMigrateClick = () => {
        migrateMutation.mutate(localClothes);
    };

    const onSubmit: SubmitHandler<ClothFormValues> = (data) => {
        const existingCloth = displayClothes.find(
            (c: any) => c.name.toLowerCase() === data.name.toLowerCase().trim() && c.id !== editingId
        );

        if (existingCloth) {
            toast.error("Cloth type already exists");
            return;
        }

        if (clothesMigrated) {
            if (editingId) {
                updateClothMutation.mutate({ id: editingId, data });
            } else {
                createClothMutation.mutate(data);
            }
        } else {
            // Local fallback
            if (editingId) {
                updateLocalCloth(editingId as number, {
                    name: data.name.trim(),
                    washPrice: data.washPrice,
                    ironingPrice: data.ironingPrice,
                    starchPrice: data.starchPrice,
                });
            } else {
                const newCloth: Cloth = {
                    id: Date.now(),
                    name: data.name.trim(),
                    washPrice: data.washPrice,
                    ironingPrice: data.ironingPrice,
                    starchPrice: data.starchPrice,
                };
                addLocalCloth(newCloth);
            }
            setShowDialog(false);
            reset();
        }
    };

    const handleEdit = (cloth: any) => {
        setValue("name", cloth.name);
        setValue("washPrice", cloth.washPrice);
        setValue("ironingPrice", cloth.ironingPrice);
        setValue("starchPrice", cloth.starchPrice);
        setEditingId(cloth.id);
        setShowDialog(true);
    };

    const handleDeleteClick = (id: string | number) => {
        setClothToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (clothToDelete !== null) {
            if (clothesMigrated) {
                deleteClothMutation.mutate(clothToDelete);
            } else {
                deleteLocalCloth(clothToDelete as number);
                setIsDeleteDialogOpen(false);
                setClothToDelete(null);
            }
        }
    };

    const handleNewClick = () => {
        reset();
        setEditingId(null);
        setShowDialog(true);
    };

    return (
        <Layout>
            <div className="space-y-8 pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Clothes Management</h1>
                        <p className="text-sm md:text-base text-muted-foreground mt-1">
                            Add and manage clothing types and pricing
                        </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {!clothesMigrated && (
                            <Button 
                                onClick={handleMigrateClick} 
                                className="gap-2 font-sans" 
                                size="lg" 
                                variant="outline"
                                disabled={migrateMutation.isPending || localClothes.length === 0}
                            >
                                <UploadCloud className="w-5 h-5" />
                                {migrateMutation.isPending ? "Migrating..." : "Migrate Data"}
                            </Button>
                        )}
                        <Button onClick={handleNewClick} className="gap-2 font-sans" size="lg">
                            <Plus className="w-5 h-5" />
                            Add Cloth Type
                        </Button>
                    </div>
                </div>

                {/* Grid of Clothes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                    {isLoadingClothes && clothesMigrated ? (
                        <div className="col-span-full text-center py-16 text-muted-foreground">
                            <p className="text-lg">Loading clothes...</p>
                        </div>
                    ) : displayClothes.length === 0 ? (
                        <div className="col-span-full text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl font-sans">
                            <p className="text-lg">No clothes added yet. Create one to get started.</p>
                        </div>
                    ) : (
                        displayClothes.map((cloth: any) => (
                            <Card
                                key={cloth.id}
                                className="border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group pt-0"
                            >
                                <CardHeader className="bg-muted/30 border-b pt-4">
                                    <CardTitle className="text-lg font-sans">{cloth.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="flex items-baseline justify-between font-sans">
                                        <p className="text-sm font-medium text-muted-foreground">Wash Price</p>
                                        <p className="text-xl font-bold text-foreground">
                                            ₦{cloth.washPrice.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-baseline justify-between font-sans">
                                        <p className="text-sm font-medium text-muted-foreground">Ironing Price</p>
                                        <p className="text-xl font-bold text-foreground">
                                            ₦{cloth.ironingPrice.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-baseline justify-between font-sans">
                                        <p className="text-sm font-medium text-muted-foreground">Starch Price</p>
                                        <p className="text-xl font-bold text-foreground">
                                            ₦{cloth.starchPrice.toLocaleString()}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 hover:text-primary hover:border-primary font-sans"
                                            onClick={() => handleEdit(cloth)}
                                        >
                                            <Edit2 className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 hover:text-destructive hover:border-destructive font-sans"
                                            onClick={() => handleDeleteClick(cloth.id)}
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
                    title="Delete Clothing Type"
                    description={`Are you sure you want to delete this clothing type? This will remove it from the list of available items for new entries.`}
                />
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Clothing Type" : "Add New Clothing Type"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-sans pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Clothing Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Shirt, T-Shirt, Saree"
                                {...register("name")}
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="washPrice">Wash Price (₦)</Label>
                            <Input
                                id="washPrice"
                                type="number"
                                step="0.01"
                                placeholder="e.g., 50"
                                {...register("washPrice", { valueAsNumber: true })}
                            />
                            {errors.washPrice && <p className="text-sm text-destructive">{errors.washPrice.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ironingPrice">Ironing Price (₦)</Label>
                            <Input
                                id="ironingPrice"
                                type="number"
                                step="0.01"
                                placeholder="e.g., 50"
                                {...register("ironingPrice", { valueAsNumber: true })}
                            />
                            {errors.ironingPrice && <p className="text-sm text-destructive">{errors.ironingPrice.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="starchPrice">Starch Price (₦)</Label>
                            <Input
                                id="starchPrice"
                                type="number"
                                step="0.01"
                                placeholder="e.g., 50"
                                {...register("starchPrice", { valueAsNumber: true })}
                            />
                            {errors.starchPrice && <p className="text-sm text-destructive">{errors.starchPrice.message}</p>}
                        </div>
                        <div className="flex gap-2 justify-end pt-4 border-t">
                            <Button variant="outline" type="button" onClick={() => setShowDialog(false)}>
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={createClothMutation.isPending || updateClothMutation.isPending}
                            >
                                {(createClothMutation.isPending || updateClothMutation.isPending) ? "Saving..." : (editingId ? "Update" : "Add")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
