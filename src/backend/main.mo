import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Migration "migration";

(with migration = Migration.run)
actor {
  type ProductionRecord = {
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

  var nextId = 0;
  let productionRecords = Map.empty<Nat, ProductionRecord>();
  let tailorRecords = Map.empty<Nat, TailorRecord>();
  let overlockRecords = Map.empty<Nat, OverlockRecord>();
  let itemMasters = Map.empty<Nat, ItemMaster>();
  let dispatchRecords = Map.empty<Nat, DispatchRecord>();

  // ProductionRecord functions

  public shared ({ caller }) func addRecord(
    date : Text,
    articleNo : Text,
    partyName : Text,
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
      partyName;
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

  public shared ({ caller }) func updateRecord(
    id : Nat,
    date : Text,
    articleNo : Text,
    partyName : Text,
    dispatchedPcs : Float,
    cutByMaster : Float,
    rate : Float,
    percentage : Float,
    totalPcs : Float,
    finalAmount : Float,
  ) : async Bool {
    switch (productionRecords.get(id)) {
      case (?_) {
        let updatedRecord : ProductionRecord = {
          id;
          date;
          articleNo;
          partyName;
          dispatchedPcs;
          cutByMaster;
          rate;
          percentage;
          totalPcs;
          finalAmount;
        };
        productionRecords.add(id, updatedRecord);
        true;
      };
      case (null) { false };
    };
  };

  public query ({ caller }) func getMasterReport() : async [(Text, Float, Float)] {
    let masterMap = Map.empty<Text, (Float, Float)>();

    productionRecords.values().forEach(
      func(record) {
        switch (masterMap.get(record.partyName)) {
          case (?existing) {
            let (pcs, amount) = existing;
            masterMap.add(record.partyName, (pcs + record.totalPcs, amount + record.finalAmount));
          };
          case (null) {
            masterMap.add(record.partyName, (record.totalPcs, record.finalAmount));
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
        masterSet.add(record.partyName, ());
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

  public shared ({ caller }) func updateTailorRecord(
    id : Nat,
    date : Text,
    articleNo : Text,
    tailorName : Text,
    color : Text,
    size : Text,
    quantity : Float,
    pcsRate : Float,
    finalAmount : Float,
  ) : async Bool {
    switch (tailorRecords.get(id)) {
      case (?_) {
        let updatedRecord : TailorRecord = {
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
        tailorRecords.add(id, updatedRecord);
        true;
      };
      case (null) { false };
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

  public shared ({ caller }) func updateOverlockRecord(
    id : Nat,
    date : Text,
    articleNo : Text,
    employeeName : Text,
    size : Text,
    quantity : Float,
    pcsRate : Float,
    finalAmount : Float,
  ) : async Bool {
    switch (overlockRecords.get(id)) {
      case (?_) {
        let updatedRecord : OverlockRecord = {
          id;
          date;
          articleNo;
          employeeName;
          size;
          quantity;
          pcsRate;
          finalAmount;
        };
        overlockRecords.add(id, updatedRecord);
        true;
      };
      case (null) { false };
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

  // ItemMaster functions

  public shared ({ caller }) func addItemMaster(
    articleNo : Text,
    totalQuantity : Float,
    sizeS : Float,
    sizeM : Float,
    sizeL : Float,
    sizeXL : Float,
    sizeXXL : Float,
  ) : async Nat {
    let id = nextId;
    nextId += 1;

    let itemMaster : ItemMaster = {
      id;
      articleNo;
      totalQuantity;
      sizeS;
      sizeM;
      sizeL;
      sizeXL;
      sizeXXL;
    };

    itemMasters.add(id, itemMaster);
    id;
  };

  public query ({ caller }) func getItemMasters() : async [ItemMaster] {
    itemMasters.values().toArray();
  };

  public shared ({ caller }) func deleteItemMaster(id : Nat) : async Bool {
    if (itemMasters.containsKey(id)) {
      itemMasters.remove(id);
      true;
    } else {
      false;
    };
  };

  public shared ({ caller }) func updateItemMaster(
    id : Nat,
    articleNo : Text,
    totalQuantity : Float,
    sizeS : Float,
    sizeM : Float,
    sizeL : Float,
    sizeXL : Float,
    sizeXXL : Float,
  ) : async Bool {
    switch (itemMasters.get(id)) {
      case (?_) {
        let updatedItemMaster : ItemMaster = {
          id;
          articleNo;
          totalQuantity;
          sizeS;
          sizeM;
          sizeL;
          sizeXL;
          sizeXXL;
        };
        itemMasters.add(id, updatedItemMaster);
        true;
      };
      case (null) { false };
    };
  };

  public query ({ caller }) func getItemMasterByArticle(articleNo : Text) : async ?ItemMaster {
    let iter = itemMasters.values();
    let found = iter.find(
      func(item) {
        item.articleNo == articleNo;
      }
    );
    switch (found) {
      case (?item) { ?item };
      case (null) { null };
    };
  };

  // Get remaining quantity for each size of an article after subtracting tailor entries
  public query ({ caller }) func getArticleRemainingBySize(articleNo : Text) : async ?(Float, Float, Float, Float, Float) {
    let iter = itemMasters.values();
    let found = iter.find(
      func(item) {
        item.articleNo == articleNo;
      }
    );

    switch (found) {
      case (?item) {
        let tailorEntries = tailorRecords.values().toArray();
        let sizeSUsed = tailorEntries.filter(func(t) { return t.articleNo == articleNo and t.size == "S" }).foldLeft(0.0, func(acc, t) { acc + t.quantity });
        let sizeMUsed = tailorEntries.filter(func(t) { return t.articleNo == articleNo and t.size == "M" }).foldLeft(0.0, func(acc, t) { acc + t.quantity });
        let sizeLUsed = tailorEntries.filter(func(t) { return t.articleNo == articleNo and t.size == "L" }).foldLeft(0.0, func(acc, t) { acc + t.quantity });
        let sizeXLUsed = tailorEntries.filter(func(t) { return t.articleNo == articleNo and t.size == "XL" }).foldLeft(0.0, func(acc, t) { acc + t.quantity });
        let sizeXXLUsed = tailorEntries.filter(func(t) { return t.articleNo == articleNo and t.size == "XXL" }).foldLeft(0.0, func(acc, t) { acc + t.quantity });

        ?(
          item.sizeS - sizeSUsed,
          item.sizeM - sizeMUsed,
          item.sizeL - sizeLUsed,
          item.sizeXL - sizeXLUsed,
          item.sizeXXL - sizeXXLUsed,
        );
      };
      case (null) { null };
    };
  };

  // DispatchRecord functions

  public shared ({ caller }) func addDispatchRecord(
    date : Text,
    articleNo : Text,
    dispatchQuantity : Float,
    salePrice : Float,
    percentage : Float,
    finalPayment : Float,
  ) : async Nat {
    let id = nextId;
    nextId += 1;

    let dispatchRecord : DispatchRecord = {
      id;
      date;
      articleNo;
      dispatchQuantity;
      salePrice;
      percentage;
      finalPayment;
    };

    dispatchRecords.add(id, dispatchRecord);
    id;
  };

  public query ({ caller }) func getDispatchRecords() : async [DispatchRecord] {
    dispatchRecords.values().toArray();
  };

  public shared ({ caller }) func deleteDispatchRecord(id : Nat) : async Bool {
    if (dispatchRecords.containsKey(id)) {
      dispatchRecords.remove(id);
      true;
    } else {
      false;
    };
  };

  public shared ({ caller }) func updateDispatchRecord(
    id : Nat,
    date : Text,
    articleNo : Text,
    dispatchQuantity : Float,
    salePrice : Float,
    percentage : Float,
    finalPayment : Float,
  ) : async Bool {
    switch (dispatchRecords.get(id)) {
      case (?_) {
        let updatedRecord : DispatchRecord = {
          id;
          date;
          articleNo;
          dispatchQuantity;
          salePrice;
          percentage;
          finalPayment;
        };
        dispatchRecords.add(id, updatedRecord);
        true;
      };
      case (null) { false };
    };
  };

  public query ({ caller }) func getDispatchedQtyByArticle(articleNo : Text) : async Float {
    let filtered = dispatchRecords.values().toArray().filter(
      func(record) { record.articleNo == articleNo }
    );

    filtered.foldLeft(0.0, func(acc, record) { acc + record.dispatchQuantity });
  };
};
