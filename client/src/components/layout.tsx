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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { pathname } = useLocation();

    return (
        <div className="flex h-screen bg-background relative">
            {/* Sidebar - Desktop */}
            <aside
                className={cn(
                    "bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 hidden md:block",
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
                                    <Icon className="w-5 h-5 shrink-0" />
                                    {sidebarOpen && <span>{item.label}</span>}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Navigation Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="fixed inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-6 shadow-xl animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-xl font-bold">DryCleaner</h1>
                            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <nav className="space-y-4">
                            {navItems.map(item => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)}>
                                        <Button
                                            variant={isActive ? "default" : "ghost"}
                                            className={cn(
                                                "w-full justify-start gap-4 text-lg py-6",
                                                isActive && "bg-sidebar-primary text-sidebar-primary-foreground",
                                            )}
                                        >
                                            <Icon className="w-6 h-6 shrink-0" />
                                            <span>{item.label}</span>
                                        </Button>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-auto min-w-0">
                <header className="border-b border-border px-4 md:px-8 py-4 flex items-center justify-between md:justify-end bg-background sticky top-0 z-40">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </Button>
                    <ModeToggle />
                </header>
                <div className="flex-1 overflow-auto p-4 md:p-8">{children}</div>
            </main>
        </div>
    );
}
