import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, CreditCard, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout";

interface Customer {
    id: number;
    name: string;
    phone?: string;
    address?: string;
}

export default function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [entries, setEntries] = useState<any[]>([]);

    useEffect(() => {
        const storedCustomers = localStorage.getItem("customers");
        if (storedCustomers) {
            const customers: Customer[] = JSON.parse(storedCustomers);
            const found = customers.find(c => c.id === Number(id));
            if (found) setCustomer(found);
        }

        const storedEntries = localStorage.getItem("entries");
        if (storedEntries) {
            setEntries(JSON.parse(storedEntries));
        }
    }, [id]);

    const customerEntries = useMemo(() => {
        if (!customer) return [];
        return entries
            .filter(e => e.customerName === customer.name)
            .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }, [customer, entries]);

    const stats = useMemo(() => {
        return {
            totalEntries: customerEntries.length,
            totalSpent: customerEntries.reduce((sum, e) => sum + e.price, 0),
            unpaidEntries: customerEntries.filter(e => !e.isPaid).length,
            lastEntry: customerEntries[0]?.dueDate,
        };
    }, [customerEntries]);

    if (!customer) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-muted-foreground mb-4">Customer not found</p>
                    <Button onClick={() => navigate("/customers")}>Back to Customers</Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-8 max-w-5xl mx-auto pb-10">
                {/* Header/Breadcrumbs */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/customers")} className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{customer.name}</h1>
                        <p className="text-muted-foreground">Customer Profile & History</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar: Info */}
                    <div className="space-y-6">
                        <Card className="border-border shadow-sm overflow-hidden">
                            <div className="h-24 bg-primary/10 flex items-center justify-center">
                                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                                    {customer.name.charAt(0)}
                                </div>
                            </div>
                            <CardContent className="pt-6 space-y-5">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                Phone
                                            </p>
                                            <p className="text-foreground">{customer.phone || "No phone provided"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                Address
                                            </p>
                                            <p className="text-foreground">
                                                {customer.address || "No address provided"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 gap-4">
                            <Card className="bg-muted/30 border-none">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                                        <CreditCard className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">
                                        ₦{stats.totalSpent.toLocaleString()}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/30 border-none">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">Entries</p>
                                        <Calendar className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{stats.totalEntries}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Main Content: History */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-foreground">Entry History</h2>
                            <Badge variant="outline" className="font-normal">
                                {customerEntries.length} Total Records
                            </Badge>
                        </div>

                        {customerEntries.length === 0 ? (
                            <Card className="border-dashed border-2 bg-transparent">
                                <CardContent className="py-20 text-center">
                                    <p className="text-muted-foreground">No laundry entries found for this customer.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {customerEntries.map(entry => (
                                    <Card
                                        key={entry.id}
                                        className="border-border shadow-none hover:border-primary/50 transition-colors group"
                                    >
                                        <CardContent className="p-5 flex items-center justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <p className="font-semibold text-lg">
                                                        ₦{entry.price.toLocaleString()}
                                                    </p>
                                                    <Badge variant={entry.isPaid ? "default" : "secondary"}>
                                                        {entry.isPaid ? "Paid" : "Unpaid"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {entry.items
                                                        .map((i: any) => `${i.quantity}x ${i.clothName}`)
                                                        .join(", ")}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                    <span>
                                                        Due:{" "}
                                                        {new Date(entry.dueDate).toLocaleDateString("en-NG", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
