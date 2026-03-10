import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface OverlockRecord {
    id: bigint;
    finalAmount: number;
    employeeName: string;
    pcsRate: number;
    date: string;
    size: string;
    articleNo: string;
    quantity: number;
}
export interface ProductionRecord {
    id: bigint;
    finalAmount: number;
    dispatchedPcs: number;
    date: string;
    rate: number;
    totalPcs: number;
    articleNo: string;
    cutByMaster: number;
    partyName: string;
    percentage: number;
}
export interface TailorRecord {
    id: bigint;
    finalAmount: number;
    pcsRate: number;
    date: string;
    tailorName: string;
    color: string;
    size: string;
    articleNo: string;
    quantity: number;
}
export interface DispatchRecord {
    id: bigint;
    date: string;
    finalPayment: number;
    articleNo: string;
    salePrice: number;
    dispatchQuantity: number;
    percentage: number;
}
export interface ItemMaster {
    id: bigint;
    sizeXXL: number;
    sizeL: number;
    sizeM: number;
    sizeS: number;
    articleNo: string;
    sizeXL: number;
    totalQuantity: number;
}
export interface backendInterface {
    addDispatchRecord(date: string, articleNo: string, dispatchQuantity: number, salePrice: number, percentage: number, finalPayment: number): Promise<bigint>;
    addItemMaster(articleNo: string, totalQuantity: number, sizeS: number, sizeM: number, sizeL: number, sizeXL: number, sizeXXL: number): Promise<bigint>;
    addOverlockRecord(date: string, articleNo: string, employeeName: string, size: string, quantity: number, pcsRate: number, finalAmount: number): Promise<bigint>;
    addRecord(date: string, articleNo: string, partyName: string, dispatchedPcs: number, cutByMaster: number, rate: number, percentage: number, totalPcs: number, finalAmount: number): Promise<bigint>;
    addTailorRecord(date: string, articleNo: string, tailorName: string, color: string, size: string, quantity: number, pcsRate: number, finalAmount: number): Promise<bigint>;
    deleteDispatchRecord(id: bigint): Promise<boolean>;
    deleteItemMaster(id: bigint): Promise<boolean>;
    deleteOverlockRecord(id: bigint): Promise<boolean>;
    deleteRecord(id: bigint): Promise<boolean>;
    deleteTailorRecord(id: bigint): Promise<boolean>;
    getArticleRemainingBySize(articleNo: string): Promise<[number, number, number, number, number] | null>;
    getArticleReport(): Promise<Array<[string, number]>>;
    getDispatchRecords(): Promise<Array<DispatchRecord>>;
    getDispatchedQtyByArticle(articleNo: string): Promise<number>;
    getItemMasterByArticle(articleNo: string): Promise<ItemMaster | null>;
    getItemMasters(): Promise<Array<ItemMaster>>;
    getMasterNames(): Promise<Array<string>>;
    getMasterReport(): Promise<Array<[string, number, number]>>;
    getOverlockRecords(): Promise<Array<OverlockRecord>>;
    getOverlockReport(): Promise<Array<[string, number, number]>>;
    getRecords(): Promise<Array<ProductionRecord>>;
    getTailorRecords(): Promise<Array<TailorRecord>>;
    getTailorReport(): Promise<Array<[string, number, number]>>;
    updateDispatchRecord(id: bigint, date: string, articleNo: string, dispatchQuantity: number, salePrice: number, percentage: number, finalPayment: number): Promise<boolean>;
    updateItemMaster(id: bigint, articleNo: string, totalQuantity: number, sizeS: number, sizeM: number, sizeL: number, sizeXL: number, sizeXXL: number): Promise<boolean>;
    updateOverlockRecord(id: bigint, date: string, articleNo: string, employeeName: string, size: string, quantity: number, pcsRate: number, finalAmount: number): Promise<boolean>;
    updateRecord(id: bigint, date: string, articleNo: string, partyName: string, dispatchedPcs: number, cutByMaster: number, rate: number, percentage: number, totalPcs: number, finalAmount: number): Promise<boolean>;
    updateTailorRecord(id: bigint, date: string, articleNo: string, tailorName: string, color: string, size: string, quantity: number, pcsRate: number, finalAmount: number): Promise<boolean>;
}
