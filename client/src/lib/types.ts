export interface Cloth {
    id: number;
    name: string;
    price: number;
    category?: string;
}

export interface Customer {
    id: number;
    name: string;
    phone?: string;
    address?: string;
}

export interface EntryItem {
    clothId: string;
    clothName: string;
    quantity: number;
    price: number;
}

export interface Entry {
    id: number;
    customerName: string;
    items: EntryItem[];
    dueDate: string;
    isPaid: boolean;
    price: number;
    createdAt: string;
    serviceType: "pickup" | "delivery";
    deliveryFee: number;
    discount: number;
}

export interface Settings {
    orgName: string;
    phone: string;
    address: string;
    bankName: string;
    bankAccount: string;
    accountName: string;
    defaultDeliveryFee: string;
}
