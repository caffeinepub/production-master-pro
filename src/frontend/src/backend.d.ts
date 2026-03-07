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
    rate: number;
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
    masterName: string;
    cutByMaster: number;
    percentage: number;
}
export interface TailorRecord {
    id: bigint;
    finalAmount: number;
    pcsRate: number;
    date: string;
    tailorName: string;
    color: string;
    articleNo: string;
    quantity: number;
}
export interface backendInterface {
    addOverlockRecord(date: string, articleNo: string, employeeName: string, quantity: number, pcsRate: number, rate: number, finalAmount: number): Promise<bigint>;
    addRecord(date: string, articleNo: string, masterName: string, dispatchedPcs: number, cutByMaster: number, rate: number, percentage: number, totalPcs: number, finalAmount: number): Promise<bigint>;
    addTailorRecord(date: string, articleNo: string, tailorName: string, color: string, quantity: number, pcsRate: number, finalAmount: number): Promise<bigint>;
    deleteOverlockRecord(id: bigint): Promise<boolean>;
    deleteRecord(id: bigint): Promise<boolean>;
    deleteTailorRecord(id: bigint): Promise<boolean>;
    getArticleReport(): Promise<Array<[string, number]>>;
    getMasterNames(): Promise<Array<string>>;
    getMasterReport(): Promise<Array<[string, number, number]>>;
    getOverlockRecords(): Promise<Array<OverlockRecord>>;
    getOverlockReport(): Promise<Array<[string, number, number]>>;
    getRecords(): Promise<Array<ProductionRecord>>;
    getTailorRecords(): Promise<Array<TailorRecord>>;
    getTailorReport(): Promise<Array<[string, number, number]>>;
}
