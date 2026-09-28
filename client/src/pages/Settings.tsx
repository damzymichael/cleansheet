import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout";
import { toast } from "sonner";
import { Building2, Landmark, CreditCard, User, Truck, Phone, MapPin, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStore } from "@/store/useStore";
import { Spinner } from "@/components/ui/spinner";

const settingsSchema = z.object({
    orgName: z.string().min(1, "Organization name is required"),
    phone: z.string().min(1, "Phone number is required"),
    address: z.string().min(1, "Business address is required"),
    bankName: z.string().min(1, "Bank name is required"),
    bankAccount: z.string().min(1, "Bank account number is required"),
    accountName: z.string().min(1, "Bank account name is required"),
    defaultDeliveryFee: z.coerce.number().min(0, "Delivery fee must be a positive number"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

type BusinessData = {
    success: boolean;
    message: string;
    data: {
        name: string;
        phone_number: string;
        address: string;
        bank_name: string;
        account_number: string;
        account_name: string;
        default_delivery_price: number;
    };
};

export default function Settings() {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.input<typeof settingsSchema>, any, SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
    });

    const { setBusinessUpdated, settings } = useStore();
    const { data: businessData, isLoading, refetch } = useQuery({
        queryKey: ["business"],
        queryFn: async () => {
            const res = await api.get<BusinessData>("/business");
            return res.data;
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: SettingsFormValues) => {
            const payload = {
                name: data.orgName,
                phone_number: data.phone,
                address: data.address,
                bank_name: data.bankName,
                account_number: data.bankAccount,
                account_name: data.accountName,
                default_delivery_price: data.defaultDeliveryFee,
            };
            const res = await api.put("/business", payload);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Settings saved successfully");
            refetch()
            setBusinessUpdated(true);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to save settings");
        },
    });

    useEffect(() => {
            console.log(settings)

        if (businessData?.data) {
            const businessInfo = businessData.data;
            
            // Check if name, phone number, and address are present
            const isUpdated = Boolean(businessInfo.name && businessInfo.phone_number && businessInfo.address);
            setBusinessUpdated(isUpdated);

            console.log(businessData.data)
            reset({
                orgName: businessInfo.name || settings.orgName,
                phone: businessInfo.phone_number || settings.phone,
                address: businessInfo.address || settings.address,
                bankName: businessInfo.bank_name || settings.bankName,
                bankAccount: businessInfo.account_number || settings.bankAccount,
                accountName: businessInfo.account_name || settings.accountName,
                defaultDeliveryFee: businessInfo.default_delivery_price || settings.defaultDeliveryFee || 0,
            });
        }
    }, [businessData, reset, setBusinessUpdated]);

    const onSubmit = (data: SettingsFormValues) => {
        mutation.mutate(data);
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-8 pb-10">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1 font-sans">
                        Configure your organization and payment details
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-primary" />
                                    Organization Details
                                </CardTitle>
                                <CardDescription className="font-sans">
                                    This information will appear on your invoices.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 font-sans">
                                <div className="space-y-2">
                                    <Label htmlFor="orgName">Organization Name *</Label>
                                    <Input
                                        id="orgName"
                                        placeholder="e.g. Clean Sheet Laundry"
                                        {...register("orgName")}
                                    />
                                    {errors.orgName && (
                                        <p className="text-sm text-destructive">{errors.orgName.message}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="flex items-center gap-1.5 font-sans">
                                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                            Business Phone *
                                        </Label>
                                        <Input id="phone" placeholder="e.g. +234 123 456 7890" {...register("phone")} />
                                        {errors.phone && (
                                            <p className="text-sm text-destructive">{errors.phone.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2 font-sans">
                                        <Label htmlFor="address" className="flex items-center gap-1.5 font-sans">
                                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                            Business Address *
                                        </Label>
                                        <Input
                                            id="address"
                                            placeholder="Enter business address"
                                            {...register("address")}
                                        />
                                        {errors.address && (
                                            <p className="text-sm text-destructive">{errors.address.message}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Landmark className="w-5 h-5 text-primary" />
                                    Bank Details
                                </CardTitle>
                                <CardDescription className="font-sans">
                                    These details will be included in the invoice for payments.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 font-sans">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                                    <div className="space-y-2 font-sans">
                                        <Label htmlFor="bankName" className="flex items-center gap-1.5 font-sans">
                                            <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
                                            Bank Name
                                        </Label>
                                        <Input id="bankName" placeholder="Enter bank name" {...register("bankName")} />
                                        {errors.bankName && (
                                            <p className="text-sm text-destructive">{errors.bankName.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2 font-sans">
                                        <Label htmlFor="bankAccount" className="flex items-center gap-1.5 font-sans">
                                            <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                                            Account Number
                                        </Label>
                                        <Input
                                            id="bankAccount"
                                            placeholder="Enter account number"
                                            {...register("bankAccount")}
                                        />
                                        {errors.bankAccount && (
                                            <p className="text-sm text-destructive">{errors.bankAccount.message}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 font-sans">
                                    <Label htmlFor="accountName" className="flex items-center gap-1.5 font-sans">
                                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                                        Account Name
                                    </Label>
                                    <Input
                                        id="accountName"
                                        placeholder="Enter account name"
                                        {...register("accountName")}
                                    />
                                    {errors.accountName && (
                                        <p className="text-sm text-destructive">{errors.accountName.message}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-sans">
                                    <Truck className="w-5 h-5 text-primary font-sans" />
                                    Delivery Settings
                                </CardTitle>
                                <CardDescription className="font-sans">
                                    Default costs for delivery services.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 font-sans">
                                    <Label htmlFor="deliveryFee">Default Delivery Fee (₦)</Label>
                                    <Input
                                        id="deliveryFee"
                                        type="number"
                                        placeholder="0"
                                        {...register("defaultDeliveryFee")}
                                    />
                                    {errors.defaultDeliveryFee && (
                                        <p className="text-sm text-destructive">{errors.defaultDeliveryFee.message}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end pt-4 font-sans">
                            <Button type="submit" size="lg" className="px-8 font-sans">
                                {mutation.isPending ? <Spinner/> : "Save Settings"}
                                
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Layout>
    );
}
