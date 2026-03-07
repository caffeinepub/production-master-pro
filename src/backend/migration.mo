import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";

module {
  type OldProductionRecord = {
    id : Nat;
    date : Text;
    articleNo : Text;
    masterName : Text;
    dispatchedPcs : Float;
    cutByMaster : Float;
    rate : Float;
    percentage : Float;
    totalPcs : Float;
    finalAmount : Float;
  };

  type OldActor = {
    nextId : Nat;
    records : Map.Map<Nat, OldProductionRecord>;
  };

  type ProductionRecord = {
    id : Nat;
    date : Text;
    articleNo : Text;
    masterName : Text;
    dispatchedPcs : Float;
    cutByMaster : Float;
    rate : Float;
    percentage : Float;
    totalPcs : Float;
    finalAmount : Float;
  };

  type TailorRecord = {
    id : Nat;
    date : Text;
    articleNo : Text;
    tailorName : Text;
    color : Text;
    quantity : Float;
    pcsRate : Float;
    finalAmount : Float;
  };

  type OverlockRecord = {
    id : Nat;
    date : Text;
    articleNo : Text;
    employeeName : Text;
    quantity : Float;
    pcsRate : Float;
    rate : Float;
    finalAmount : Float;
  };

  type NewActor = {
    nextId : Nat;
    productionRecords : Map.Map<Nat, ProductionRecord>;
    tailorRecords : Map.Map<Nat, TailorRecord>;
    overlockRecords : Map.Map<Nat, OverlockRecord>;
  };

  public func run(old : OldActor) : NewActor {
    {
      nextId = old.nextId;
      productionRecords = old.records;
      tailorRecords = Map.empty<Nat, TailorRecord>();
      overlockRecords = Map.empty<Nat, OverlockRecord>();
    };
  };
};
