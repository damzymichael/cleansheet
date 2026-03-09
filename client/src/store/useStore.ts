import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Cloth, Customer, Entry, Settings } from "@/lib/types";

interface AppState {
    entries: Entry[];
    customers: Customer[];
    clothes: Cloth[];
    settings: Settings;

    // Actions
    setEntries: (entries: Entry[]) => void;
    addEntry: (entry: Entry) => void;
    updateEntry: (id: number, entry: Partial<Entry>) => void;
    deleteEntry: (id: number) => void;

    setCustomers: (customers: Customer[]) => void;
    addCustomer: (customer: Customer) => void;
    updateCustomer: (id: number, customer: Partial<Customer>) => void;
    deleteCustomer: (id: number) => void;

    setClothes: (clothes: Cloth[]) => void;
    addCloth: (cloth: Cloth) => void;
    updateCloth: (id: number, cloth: Partial<Cloth>) => void;
    deleteCloth: (id: number) => void;

    updateSettings: (settings: Partial<Settings>) => void;
}

export const useStore = create<AppState>()(
    persist(
        set => ({
            entries: [],
            customers: [],
            clothes: [],
            settings: {
                orgName: "",
                phone: "",
                address: "",
                bankName: "",
                bankAccount: "",
                accountName: "",
                defaultDeliveryFee: "0",
            },

            setEntries: entries => set({ entries }),
            addEntry: entry => set(state => ({ entries: [...state.entries, entry] })),
            updateEntry: (id, updatedEntry) =>
                set(state => ({
                    entries: state.entries.map(e => (e.id === id ? { ...e, ...updatedEntry } : e)),
                })),
            deleteEntry: id =>
                set(state => ({
                    entries: state.entries.filter(e => e.id !== id),
                })),

            setCustomers: customers => set({ customers }),
            addCustomer: customer => set(state => ({ customers: [...state.customers, customer] })),
            updateCustomer: (id, updatedCustomer) =>
                set(state => ({
                    customers: state.customers.map(c => (c.id === id ? { ...c, ...updatedCustomer } : c)),
                })),
            deleteCustomer: id =>
                set(state => ({
                    customers: state.customers.filter(c => c.id !== id),
                })),

            setClothes: clothes => set({ clothes }),
            addCloth: cloth => set(state => ({ clothes: [...state.clothes, cloth] })),
            updateCloth: (id, updatedCloth) =>
                set(state => ({
                    clothes: state.clothes.map(c => (c.id === id ? { ...c, ...updatedCloth } : c)),
                })),
            deleteCloth: id =>
                set(state => ({
                    clothes: state.clothes.filter(c => c.id !== id),
                })),

            updateSettings: newSettings =>
                set(state => ({
                    settings: { ...state.settings, ...newSettings },
                })),
        }),
        {
            name: "cleansheet-storage",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
