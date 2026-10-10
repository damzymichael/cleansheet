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

export interface PaginationMeta {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
}

export interface PaginatedData<T> {
    items: T[];
    meta: PaginationMeta;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface ServerCustomer {
    id: string;
    name: string;
    phone_number: string;
    address: string;
    id_in_browser: number | null;
    number_of_entries?: string | number;
    total_value?: string | number;
}

export interface ServerItem {
    id: string;
    name: string;
    wash_price: number;
    iron_price: number;
    starch_price: number;
}

export interface ServerEntryItem {
    id: string;
    item_id: string;
    cloth_name: string;
    quantity: number;
    wash: boolean;
    iron: boolean;
    starch: boolean;
    price: number;
}

export interface ServerEntry {
    id: string;
    customer_name: string;
    customer_id: string;
    items: ServerEntryItem[];
    due_date: string | null;
    collection_mode: string;
    delivery_fee: number;
    discount_price: number;
    paid: boolean;
    price: number;
    id_in_browser: number | null;
    created_at: string | null;
}

