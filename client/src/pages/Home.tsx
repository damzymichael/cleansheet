import { useMemo } from "react";
import { Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";

export default function Home() {
    const navigate = useNavigate();
    const { entries } = useStore();

    const stats = useMemo(() => {
        const today = new Date();
        const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

        return {
            total: entries.length,
            paid: entries.filter(e => e.isPaid).length,
            unpaid: entries.filter(e => !e.isPaid).length,
            due: entries.filter(e => {
                const dueDate = new Date(e.dueDate);
                return dueDate <= threeDays && dueDate >= today;
            }).length,
        };
    }, [entries]);

    const upcomingEntries = useMemo(() => {
        const today = new Date();
        const threeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
        return entries
            .filter(e => {
                const dueDate = new Date(e.dueDate);
                return dueDate <= threeDays && dueDate >= today;
            })
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [entries]);

    return (
        <Layout>
            <div className="space-y-8 pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
                        <p className="text-sm md:text-base text-muted-foreground">Manage your dry-cleaning business</p>
                    </div>
                    <Button onClick={() => navigate("/entries/new")} className="gap-2 w-full sm:w-auto" size="lg">
                        <Plus className="w-5 h-5" />
                        New Entry
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2 px-4 md:px-6">
                            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Total Entries
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6 pt-0 md:pt-0">
                            <div className="text-2xl md:text-3xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2 px-4 md:px-6">
                            <CardTitle className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                                Paid
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6 pt-0 md:pt-0">
                            <div className="text-2xl md:text-3xl font-bold">{stats.paid}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2 px-4 md:px-6">
                            <CardTitle className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-amber-600" />
                                Unpaid
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6 pt-0 md:pt-0">
                            <div className="text-2xl md:text-3xl font-bold">{stats.unpaid}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2 px-4 md:px-6">
                            <CardTitle className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                                Due Soon
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6 pt-0 md:pt-0">
                            <div className="text-2xl md:text-3xl font-bold">{stats.due}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming Entries */}
                <Card>
                    <CardHeader>
                        <CardTitle>Due in Next 3 Days</CardTitle>
                        <CardDescription>
                            Entries that are ready to pick up or approaching their due date
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="font-sans">
                        {upcomingEntries.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No entries due in the next 3 days</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingEntries.map(entry => (
                                    <div
                                        key={entry.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-none gap-4"
                                    >
                                        <div className="space-y-1">
                                            <p className="font-medium">{entry.customerName}</p>
                                            <p className="text-xs md:text-sm text-muted-foreground">
                                                {entry.items.length} item(s) •{" "}
                                                {entry.items
                                                    .map((i: any) => i.quantity)
                                                    .reduce((a: number, b: number) => a + b, 0)}{" "}
                                                pieces
                                            </p>
                                        </div>
                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 font-sans">
                                            <p className="text-sm font-medium order-2 sm:order-1 font-sans">
                                                {new Date(entry.dueDate).toLocaleDateString()}
                                            </p>
                                            <div className="flex gap-2 order-1 sm:order-2">
                                                <Badge variant={entry.isPaid ? "default" : "secondary"}>
                                                    {entry.isPaid ? "Paid" : "Unpaid"}
                                                </Badge>
                                                <Badge variant="outline">₦{entry.price.toLocaleString()}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
