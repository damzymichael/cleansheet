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

import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { SpinnerBadge } from "@/components/spinner-badge";

export default function Layout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { pathname } = useLocation();

    // Pull to Refresh Implementation
    const handleRefresh = async () => {
        // Here we simulate fetching updates from the server
        // In a real app, you might refetch data via a global state manager or query client
        // For a full PWA refresh (including service worker updates), reload is best
        return new Promise<void>(resolve => {
            setTimeout(() => {
                window.location.reload();
                resolve();
            }, 800);
        });
    };

    const { pullDistance, isRefreshing, containerRef } = usePullToRefresh(handleRefresh);

    return (
        <div className="flex h-screen bg-background relative overflow-hidden">
            {/* Sidebar - Desktop */}
            <aside
                className={cn(
                    "bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 hidden md:block",
                    sidebarOpen ? "w-64" : "w-20",
                )}
            >
                <div className="p-6 flex items-center justify-between">
                    {sidebarOpen && <h1 className="text-xl font-bold">Laundry</h1>}
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                    </Button>
                </div>

                <nav className="space-y-2 px-3 focus-visible:outline-none">
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

            {/* Mobile Navigation Overlay - Same as before */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="fixed inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-6 shadow-xl animate-in slide-in-from-left duration-300"
                    >
                        <div className="flex items-center justify-between mb-8 pb-4 border-b">
                            <h1 className="text-xl font-bold">Laundry</h1>
                            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <nav className="space-y-3">
                            {navItems.map(item => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)}>
                                        <Button
                                            variant={isActive ? "default" : "ghost"}
                                            className={cn(
                                                "w-full justify-start gap-4 text-base py-6 rounded-xl hover:bg-sidebar-accent transition-all duration-200",
                                                isActive &&
                                                    "bg-sidebar-primary text-sidebar-primary-foreground shadow-md scale-[1.02]",
                                            )}
                                        >
                                            <Icon className="w-5 h-5 shrink-0" />
                                            <span className="font-semibold">{item.label}</span>
                                        </Button>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
                <header className="border-b border-border px-4 md:px-8 py-4 flex items-center justify-between md:justify-end bg-background sticky top-0 z-40 shrink-0">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </Button>
                    <ModeToggle />
                </header>

                <div
                    ref={containerRef}
                    className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative touch-pan-y"
                    style={{ WebkitOverflowScrolling: "touch" }}
                >
                    {/* Pull to Refresh Indicator */}
                    <div
                        className="absolute top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-transform duration-200 ease-out"
                        style={{
                            transform: `translateY(${pullDistance - 50}px)`,
                            opacity: pullDistance > 10 ? Math.min(pullDistance / 50, 1) : 0,
                        }}
                    >
                        <div className="mt-2 scale-110 shadow-lg rounded-full overflow-hidden">
                            <SpinnerBadge />
                        </div>
                    </div>

                    {/* Content with Pull-down Translation */}
                    <div
                        className="h-full"
                        style={{
                            transform: `translateY(${pullDistance}px)`,
                            transition: isRefreshing ? "none" : "transform 150ms cubic-bezier(0,0,0.2,1)",
                            willChange: "transform",
                        }}
                    >
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
