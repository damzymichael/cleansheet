"use client";

import React from "react";

import { Link, useLocation } from "react-router-dom";
import { Home, FileText, Shirt, Users, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";

const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/entries", label: "Entries", icon: FileText },
    { href: "/clothes", label: "Clothes", icon: Shirt },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/staff", label: "Staff", icon: Shield },
];

export default function Layout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { pathname } = useLocation();

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside
                className={cn(
                    "bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
                    sidebarOpen ? "w-64" : "w-20",
                )}
            >
                <div className="p-6 flex items-center justify-between">
                    {sidebarOpen && <h1 className="text-xl font-bold">DryCleaner</h1>}
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                </div>

                <nav className="space-y-2 px-3">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} to={item.href}>
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-3",
                                        isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                                    )}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    {sidebarOpen && <span>{item.label}</span>}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-auto">
                <header className="border-b border-border px-8 py-4 flex items-center justify-end bg-background">
                    <ModeToggle />
                </header>
                <div className="flex-1 overflow-auto p-8">{children}</div>
            </main>
        </div>
    );
}
