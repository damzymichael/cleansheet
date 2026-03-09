import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout";
import { EntryForm } from "@/components/entry-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NewEntry() {
    const navigate = useNavigate();
    const handleAddEntry = (entry: any) => {
        const stored = localStorage.getItem("entries");
        const entries = stored ? JSON.parse(stored) : [];
        const newEntries = [...entries, entry];
        localStorage.setItem("entries", JSON.stringify(newEntries));
        navigate("/entries");
    };
    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6 pb-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Create New Entry</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">
                        Enter the details for the new laundry order
                    </p>
                </div>
                <Card className="border-border shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl">Entry Details</CardTitle>
                        <CardDescription>Fill in the required information below to record a new entry.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EntryForm onSubmit={handleAddEntry} onCancel={() => navigate(-1)} />
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
