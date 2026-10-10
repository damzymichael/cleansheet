export interface Cloth {
    id: number | string;
    name: string;
    price?: number;
    washPrice: number;
    ironingPrice: number;
    starchPrice: number;
    category?: string;
}

export interface Customer {
    id: number;
    name: string;
    phone?: string;
    address?: string;
}

export interface EntryItem {
    id?: string;
    clothId?: string;
    clothName: string;
    quantity: number;
    price: number;
    wash?: boolean;
    iron?: boolean;
    starch?: boolean;
}

export interface Entry {
    id: number | string;
    id_in_browser?: number | null;
    customerName: string;
    customerId?: string;
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
