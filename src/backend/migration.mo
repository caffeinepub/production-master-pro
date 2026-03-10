import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";

module {
  // Old record types
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

  type TailorRecord = {
    id : Nat;
    date : Text;
    articleNo : Text;
    tailorName : Text;
    color : Text;
    size : Text;
    quantity : Float;
    pcsRate : Float;
    finalAmount : Float;
  };

  type OverlockRecord = {
    id : Nat;
    date : Text;
    articleNo : Text;
    employeeName : Text;
    size : Text;
    quantity : Float;
    pcsRate : Float;
    finalAmount : Float;
  };

  type OldActor = {
    nextId : Nat;
    productionRecords : Map.Map<Nat, OldProductionRecord>;
    tailorRecords : Map.Map<Nat, TailorRecord>;
    overlockRecords : Map.Map<Nat, OverlockRecord>;
  };

  // New record types
  type NewProductionRecord = {
    id : Nat;
    date : Text;
    articleNo : Text;
    partyName : Text;
    dispatchedPcs : Float;
    cutByMaster : Float;
    rate : Float;
    percentage : Float;
    totalPcs : Float;
    finalAmount : Float;
  };

  type ItemMaster = {
    id : Nat;
    articleNo : Text;
    totalQuantity : Float;
    sizeS : Float;
    sizeM : Float;
    sizeL : Float;
    sizeXL : Float;
    sizeXXL : Float;
  };

  type DispatchRecord = {
    id : Nat;
    date : Text;
    articleNo : Text;
    dispatchQuantity : Float;
    salePrice : Float;
    percentage : Float;
    finalPayment : Float;
  };

  type NewActor = {
    nextId : Nat;
    productionRecords : Map.Map<Nat, NewProductionRecord>;
    tailorRecords : Map.Map<Nat, TailorRecord>;
    overlockRecords : Map.Map<Nat, OverlockRecord>;
    itemMasters : Map.Map<Nat, ItemMaster>;
    dispatchRecords : Map.Map<Nat, DispatchRecord>;
  };

  public func run(old : OldActor) : NewActor {
    // Transform productionRecords masterName to partyName
    let newProductionRecords = old.productionRecords.map<Nat, OldProductionRecord, NewProductionRecord>(
      func(_id, oldRecord) {
        {
          oldRecord with
          partyName = oldRecord.masterName;
        };
      }
    );

    {
      old with
      productionRecords = newProductionRecords;
      itemMasters = Map.empty<Nat, ItemMaster>();
      dispatchRecords = Map.empty<Nat, DispatchRecord>();
    };
  };
};
