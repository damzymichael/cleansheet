import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout";
import { toast } from "sonner";
import { Building2, Landmark, CreditCard, User, Truck } from "lucide-react";

export default function Settings() {
    const [settings, setSettings] = useState({
        orgName: "",
        bankName: "",
        bankAccount: "",
        accountName: "",
        defaultDeliveryFee: "0",
    });

    useEffect(() => {
        const stored = localStorage.getItem("settings");
        if (stored) {
            setSettings(JSON.parse(stored));
        }
    }, []);

    const handleSave = () => {
        if (!settings.orgName) {
            toast.error("Organization name is required");
            return;
        }
        localStorage.setItem("settings", JSON.stringify(settings));
        toast.success("Settings saved successfully");
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-8 pb-10">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                    <p className="text-muted-foreground mt-1">Configure your organization and payment details</p>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                Organization Details
                            </CardTitle>
                            <CardDescription>This name will appear at the top of your invoices.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="orgName">Organization Name *</Label>
                                <Input
                                    id="orgName"
                                    placeholder="e.g. Clean Sheet Laundry"
                                    value={settings.orgName}
                                    onChange={e => setSettings({ ...settings, orgName: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Landmark className="w-5 h-5 text-primary" />
                                Bank Details
                            </CardTitle>
                            <CardDescription>
                                These details will be included in the invoice for payments.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bankName" className="flex items-center gap-1.5">
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
                                <div className="space-y-2">
                                    <Label htmlFor="bankAccount" className="flex items-center gap-1.5">
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
                            <div className="space-y-2">
                                <Label htmlFor="accountName" className="flex items-center gap-1.5">
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
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-primary" />
                                Delivery Settings
                            </CardTitle>
                            <CardDescription>Default costs for delivery services.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
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

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} size="lg" className="px-8">
                            Save Settings
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
