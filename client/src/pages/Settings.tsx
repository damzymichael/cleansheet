import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout";
import { toast } from "sonner";
import { Building2, Landmark, CreditCard, User, Truck, Phone, MapPin } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function Settings() {
    const { settings: storeSettings, updateSettings } = useStore();
    const [settings, setSettings] = useState(storeSettings);

    useEffect(() => {
        setSettings(storeSettings);
    }, [storeSettings]);

    const handleSave = () => {
        if (!settings.orgName) {
            toast.error("Organization name is required");
            return;
        }
        if (!settings.phone) {
            toast.error("Phone number is required");
            return;
        }
        if (!settings.address) {
            toast.error("Business address is required");
            return;
        }
        updateSettings(settings);
        toast.success("Settings saved successfully");
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

                <div className="grid gap-6">
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
                                    value={settings.orgName}
                                    onChange={e => setSettings({ ...settings, orgName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-1.5 font-sans">
                                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                        Business Phone *
                                    </Label>
                                    <Input
                                        id="phone"
                                        placeholder="e.g. +234 123 456 7890"
                                        value={settings.phone}
                                        onChange={e => setSettings({ ...settings, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 font-sans">
                                    <Label htmlFor="address" className="flex items-center gap-1.5 font-sans">
                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                        Business Address *
                                    </Label>
                                    <Input
                                        id="address"
                                        placeholder="Enter business address"
                                        value={settings.address}
                                        onChange={e => setSettings({ ...settings, address: e.target.value })}
                                    />
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
                                    <Input
                                        id="bankName"
                                        placeholder="Enter bank name"
                                        value={settings.bankName}
                                        onChange={e => setSettings({ ...settings, bankName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 font-sans">
                                    <Label htmlFor="bankAccount" className="flex items-center gap-1.5 font-sans">
                                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                                        Account Number
                                    </Label>
                                    <Input
                                        id="bankAccount"
                                        placeholder="Enter account number"
                                        value={settings.bankAccount}
                                        onChange={e => setSettings({ ...settings, bankAccount: e.target.value })}
                                    />
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
                                    value={settings.accountName}
                                    onChange={e => setSettings({ ...settings, accountName: e.target.value })}
                                />
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
                                    value={settings.defaultDeliveryFee}
                                    onChange={e => setSettings({ ...settings, defaultDeliveryFee: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4 font-sans">
                        <Button onClick={handleSave} size="lg" className="px-8 font-sans">
                            Save Settings
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
