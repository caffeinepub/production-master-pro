import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  OverlockRecord,
  ProductionRecord,
  TailorRecord,
} from "../backend";
import { useActor } from "./useActor";

export function useGetRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<ProductionRecord[]>({
    queryKey: ["records"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMasterNames() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["masterNames"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMasterNames();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMasterReport() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, number, number]>>({
    queryKey: ["masterReport"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMasterReport();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetArticleReport() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, number]>>({
    queryKey: ["articleReport"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getArticleReport();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      date: string;
      articleNo: string;
      masterName: string;
      dispatchedPcs: number;
      cutByMaster: number;
      rate: number;
      percentage: number;
      totalPcs: number;
      finalAmount: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addRecord(
        params.date,
        params.articleNo,
        params.masterName,
        params.dispatchedPcs,
        params.cutByMaster,
        params.rate,
        params.percentage,
        params.totalPcs,
        params.finalAmount,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["masterNames"] });
      queryClient.invalidateQueries({ queryKey: ["masterReport"] });
      queryClient.invalidateQueries({ queryKey: ["articleReport"] });
    },
  });
}

export function useDeleteRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteRecord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records"] });
      queryClient.invalidateQueries({ queryKey: ["masterReport"] });
      queryClient.invalidateQueries({ queryKey: ["articleReport"] });
    },
  });
}

// ─── Tailor Hooks ───────────────────────────────────────────────────────────

export function useGetTailorRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<TailorRecord[]>({
    queryKey: ["tailorRecords"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTailorRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTailorReport() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, number, number]>>({
    queryKey: ["tailorReport"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTailorReport();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTailorRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      date: string;
      articleNo: string;
      tailorName: string;
      color: string;
      quantity: number;
      pcsRate: number;
      finalAmount: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addTailorRecord(
        params.date,
        params.articleNo,
        params.tailorName,
        params.color,
        params.quantity,
        params.pcsRate,
        params.finalAmount,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tailorRecords"] });
      queryClient.invalidateQueries({ queryKey: ["tailorReport"] });
    },
  });
}

export function useDeleteTailorRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteTailorRecord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tailorRecords"] });
      queryClient.invalidateQueries({ queryKey: ["tailorReport"] });
    },
  });
}

// ─── Overlock Hooks ──────────────────────────────────────────────────────────

export function useGetOverlockRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<OverlockRecord[]>({
    queryKey: ["overlockRecords"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOverlockRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetOverlockReport() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, number, number]>>({
    queryKey: ["overlockReport"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOverlockReport();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddOverlockRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      date: string;
      articleNo: string;
      employeeName: string;
      quantity: number;
      pcsRate: number;
      rate: number;
      finalAmount: number;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addOverlockRecord(
        params.date,
        params.articleNo,
        params.employeeName,
        params.quantity,
        params.pcsRate,
        params.rate,
        params.finalAmount,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overlockRecords"] });
      queryClient.invalidateQueries({ queryKey: ["overlockReport"] });
    },
  });
}

export function useDeleteOverlockRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteOverlockRecord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overlockRecords"] });
      queryClient.invalidateQueries({ queryKey: ["overlockReport"] });
    },
  });
}
