import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Iter "mo:core/Iter";



actor {
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

  module ProductionRecord {
    public func compareByDateDescending(record1 : ProductionRecord, record2 : ProductionRecord) : Order.Order {
      switch (Text.compare(record2.date, record1.date)) {
        case (#equal) { Nat.compare(record1.id, record2.id) };
        case (order) { order };
      };
    };
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

  module TailorRecord {
    public func compareByDateDescending(record1 : TailorRecord, record2 : TailorRecord) : Order.Order {
      switch (Text.compare(record2.date, record1.date)) {
        case (#equal) { Nat.compare(record1.id, record2.id) };
        case (order) { order };
      };
    };
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

  module OverlockRecord {
    public func compareByDateDescending(record1 : OverlockRecord, record2 : OverlockRecord) : Order.Order {
      switch (Text.compare(record2.date, record1.date)) {
        case (#equal) { Nat.compare(record1.id, record2.id) };
        case (order) { order };
      };
    };
  };

  stable var nextId = 0;
  stable var productionRecords = Map.empty<Nat, ProductionRecord>();
  stable var tailorRecords = Map.empty<Nat, TailorRecord>();
  stable var overlockRecords = Map.empty<Nat, OverlockRecord>();

  // ProductionRecord functions

  public shared ({ caller }) func addRecord(
    date : Text,
    articleNo : Text,
    masterName : Text,
    dispatchedPcs : Float,
    cutByMaster : Float,
    rate : Float,
    percentage : Float,
    totalPcs : Float,
    finalAmount : Float,
  ) : async Nat {
    let id = nextId;
    nextId += 1;

    let record : ProductionRecord = {
      id;
      date;
      articleNo;
      masterName;
      dispatchedPcs;
      cutByMaster;
      rate;
      percentage;
      totalPcs;
      finalAmount;
    };

    productionRecords.add(id, record);
    id;
  };

  public query ({ caller }) func getRecords() : async [ProductionRecord] {
    productionRecords.values().toArray().sort(ProductionRecord.compareByDateDescending);
  };

  public shared ({ caller }) func deleteRecord(id : Nat) : async Bool {
    if (productionRecords.containsKey(id)) {
      productionRecords.remove(id);
      true;
    } else {
      false;
    };
  };

  public query ({ caller }) func getMasterReport() : async [(Text, Float, Float)] {
    let masterMap = Map.empty<Text, (Float, Float)>();

    productionRecords.values().forEach(
      func(record) {
        switch (masterMap.get(record.masterName)) {
          case (?existing) {
            let (pcs, amount) = existing;
            masterMap.add(record.masterName, (pcs + record.totalPcs, amount + record.finalAmount));
          };
          case (null) {
            masterMap.add(record.masterName, (record.totalPcs, record.finalAmount));
          };
        };
      }
    );

    masterMap.entries().toArray().map(
      func((masterName, totals)) {
        let (totalPcs, totalAmount) = totals;
        (masterName, totalPcs, totalAmount);
      }
    );
  };

  public query ({ caller }) func getArticleReport() : async [(Text, Float)] {
    let articleMap = Map.empty<Text, Float>();

    productionRecords.values().forEach(
      func(record) {
        switch (articleMap.get(record.articleNo)) {
          case (?existing) {
            articleMap.add(record.articleNo, existing + record.totalPcs);
          };
          case (null) {
            articleMap.add(record.articleNo, record.totalPcs);
          };
        };
      }
    );

    articleMap.entries().toArray();
  };

  public query ({ caller }) func getMasterNames() : async [Text] {
    let masterSet = Map.empty<Text, ()>();

    productionRecords.values().forEach(
      func(record) {
        masterSet.add(record.masterName, ());
      }
    );

    masterSet.keys().toArray();
  };

  // TailorRecord functions

  public shared ({ caller }) func addTailorRecord(
    date : Text,
    articleNo : Text,
    tailorName : Text,
    color : Text,
    size : Text,
    quantity : Float,
    pcsRate : Float,
    finalAmount : Float,
  ) : async Nat {
    let id = nextId;
    nextId += 1;

    let record : TailorRecord = {
      id;
      date;
      articleNo;
      tailorName;
      color;
      size;
      quantity;
      pcsRate;
      finalAmount;
    };

    tailorRecords.add(id, record);
    id;
  };

  public query ({ caller }) func getTailorRecords() : async [TailorRecord] {
    tailorRecords.values().toArray().sort(TailorRecord.compareByDateDescending);
  };

  public shared ({ caller }) func deleteTailorRecord(id : Nat) : async Bool {
    if (tailorRecords.containsKey(id)) {
      tailorRecords.remove(id);
      true;
    } else {
      false;
    };
  };

  public query ({ caller }) func getTailorReport() : async [(Text, Float, Float)] {
    let tailorMap = Map.empty<Text, (Float, Float)>();

    tailorRecords.values().forEach(
      func(record) {
        switch (tailorMap.get(record.tailorName)) {
          case (?existing) {
            let (qty, amount) = existing;
            tailorMap.add(record.tailorName, (qty + record.quantity, amount + record.finalAmount));
          };
          case (null) {
            tailorMap.add(record.tailorName, (record.quantity, record.finalAmount));
          };
        };
      }
    );

    tailorMap.entries().toArray().map(
      func((tailorName, totals)) {
        let (totalQty, totalAmount) = totals;
        (tailorName, totalQty, totalAmount);
      }
    );
  };

  // OverlockRecord functions

  public shared ({ caller }) func addOverlockRecord(
    date : Text,
    articleNo : Text,
    employeeName : Text,
    size : Text,
    quantity : Float,
    pcsRate : Float,
    finalAmount : Float,
  ) : async Nat {
    let id = nextId;
    nextId += 1;

    let record : OverlockRecord = {
      id;
      date;
      articleNo;
      employeeName;
      size;
      quantity;
      pcsRate;
      finalAmount;
    };

    overlockRecords.add(id, record);
    id;
  };

  public query ({ caller }) func getOverlockRecords() : async [OverlockRecord] {
    overlockRecords.values().toArray().sort(OverlockRecord.compareByDateDescending);
  };

  public shared ({ caller }) func deleteOverlockRecord(id : Nat) : async Bool {
    if (overlockRecords.containsKey(id)) {
      overlockRecords.remove(id);
      true;
    } else {
      false;
    };
  };

  public query ({ caller }) func getOverlockReport() : async [(Text, Float, Float)] {
    let overlockMap = Map.empty<Text, (Float, Float)>();

    overlockRecords.values().forEach(
      func(record) {
        switch (overlockMap.get(record.employeeName)) {
          case (?existing) {
            let (qty, amount) = existing;
            overlockMap.add(record.employeeName, (qty + record.quantity, amount + record.finalAmount));
          };
          case (null) {
            overlockMap.add(record.employeeName, (record.quantity, record.finalAmount));
          };
        };
      }
    );

    overlockMap.entries().toArray().map(
      func((employeeName, totals)) {
        let (totalQty, totalAmount) = totals;
        (employeeName, totalQty, totalAmount);
      }
    );
  };
};
