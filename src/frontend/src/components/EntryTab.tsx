import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Package, RotateCcw, Save, TrendingUp } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAddRecord, useGetMasterNames } from "../hooks/useQueries";

interface FormState {
  date: string;
  articleNo: string;
  masterName: string;
  dispatchedPcs: string;
  cutByMaster: string;
  rate: string;
  percentage: string;
}

interface FormErrors {
  date?: string;
  articleNo?: string;
  masterName?: string;
  dispatchedPcs?: string;
  cutByMaster?: string;
  rate?: string;
  percentage?: string;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function calcResults(form: FormState) {
  const dispatched = Number.parseFloat(form.dispatchedPcs) || 0;
  const cut = Number.parseFloat(form.cutByMaster) || 0;
  const rate = Number.parseFloat(form.rate) || 0;
  const percentage = Number.parseFloat(form.percentage) || 0;

  const totalPcs = dispatched - cut;
  const finalAmount = (dispatched * rate * percentage) / 100;

  return { totalPcs, amount: finalAmount, finalAmount };
}

export function EntryTab() {
  const [form, setForm] = useState<FormState>({
    date: getTodayDate(),
    articleNo: "",
    masterName: "",
    dispatchedPcs: "",
    cutByMaster: "",
    rate: "",
    percentage: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showResult, setShowResult] = useState(false);

  const { data: masterNames = [] } = useGetMasterNames();
  const addRecord = useAddRecord();

  const calc = calcResults(form);

  const handleChange = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      // Auto-recalculate if showing result
      setShowResult(false);
    },
    [],
  );

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.date) newErrors.date = "Date is required";
    if (!form.articleNo.trim()) newErrors.articleNo = "Article No. is required";
    if (!form.masterName.trim())
      newErrors.masterName = "Master Name is required";
    if (!form.dispatchedPcs || Number.isNaN(Number(form.dispatchedPcs)))
      newErrors.dispatchedPcs = "Enter valid dispatched pieces";
    if (!form.cutByMaster || Number.isNaN(Number(form.cutByMaster)))
      newErrors.cutByMaster = "Enter valid cut pieces";
    if (!form.rate || Number.isNaN(Number(form.rate)))
      newErrors.rate = "Enter valid rate";
    if (!form.percentage || Number.isNaN(Number(form.percentage)))
      newErrors.percentage = "Enter valid percentage";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = () => {
    if (
      form.dispatchedPcs &&
      form.cutByMaster &&
      form.rate &&
      form.percentage
    ) {
      setShowResult(true);
    } else {
      setShowResult(true);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    const { totalPcs, finalAmount } = calcResults(form);

    try {
      await addRecord.mutateAsync({
        date: form.date,
        articleNo: form.articleNo.trim(),
        masterName: form.masterName.trim(),
        dispatchedPcs: Number(form.dispatchedPcs),
        cutByMaster: Number(form.cutByMaster),
        rate: Number(form.rate),
        percentage: Number(form.percentage),
        totalPcs,
        finalAmount,
      });
      toast.success("Record saved successfully!", {
        description: `${form.masterName} — ₨ ${finalAmount.toFixed(2)}`,
      });
      handleClear();
    } catch {
      toast.error("Failed to save record. Please try again.");
    }
  };

  const handleClear = () => {
    setForm({
      date: getTodayDate(),
      articleNo: "",
      masterName: "",
      dispatchedPcs: "",
      cutByMaster: "",
      rate: "",
      percentage: "",
    });
    setErrors({});
    setShowResult(false);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Result Card */}
      <div
        data-ocid="entry.result_card"
        className="rounded-lg border-2 overflow-hidden"
        style={{
          borderColor: showResult
            ? "oklch(var(--primary))"
            : "oklch(var(--border))",
          background: showResult
            ? "oklch(var(--primary) / 0.06)"
            : "oklch(var(--muted))",
          transition: "all 0.2s ease",
        }}
      >
        <div
          className="px-4 py-3 flex items-center gap-2 border-b"
          style={{
            borderColor: showResult
              ? "oklch(var(--primary) / 0.2)"
              : "oklch(var(--border))",
          }}
        >
          <TrendingUp
            className="w-4 h-4"
            style={{
              color: showResult
                ? "oklch(var(--primary))"
                : "oklch(var(--muted-foreground))",
            }}
          />
          <span
            className="data-label"
            style={{ color: showResult ? "oklch(var(--primary))" : undefined }}
          >
            Calculation Result
          </span>
        </div>
        <div className="px-4 py-3 grid grid-cols-3 gap-3">
          <div>
            <div className="data-label mb-1 flex items-center gap-1">
              <Package className="w-3 h-3" />
              Dispatched Pcs
            </div>
            <div
              className="data-value"
              style={{
                color: showResult
                  ? "oklch(var(--foreground))"
                  : "oklch(var(--muted-foreground))",
              }}
            >
              {showResult
                ? (Number(form.dispatchedPcs) || 0).toLocaleString()
                : "—"}
            </div>
          </div>
          <div>
            <div className="data-label mb-1 flex items-center gap-1">
              <Package className="w-3 h-3" />
              Pending Pcs
            </div>
            <div
              className="data-value"
              style={{
                color:
                  showResult && calc.totalPcs >= 0
                    ? "oklch(var(--primary))"
                    : "oklch(var(--muted-foreground))",
              }}
            >
              {showResult ? calc.totalPcs.toLocaleString() : "—"}
            </div>
          </div>
          <div>
            <div className="data-label mb-1">Final Amount</div>
            <div
              className="data-value"
              style={{
                color:
                  showResult && calc.finalAmount > 0
                    ? "oklch(var(--success))"
                    : "oklch(var(--muted-foreground))",
              }}
            >
              {showResult ? `₨ ${calc.finalAmount.toFixed(2)}` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3">
        {/* Date */}
        <div className="space-y-1">
          <Label htmlFor="entry-date" className="data-label">
            Date
          </Label>
          <Input
            id="entry-date"
            data-ocid="entry.date_input"
            type="date"
            value={form.date}
            onChange={handleChange("date")}
            className="input-factory"
            style={
              errors.date ? { borderColor: "oklch(var(--destructive))" } : {}
            }
          />
          {errors.date && (
            <p
              data-ocid="entry.error_state"
              className="text-xs font-medium"
              style={{ color: "oklch(var(--destructive))" }}
            >
              {errors.date}
            </p>
          )}
        </div>

        {/* Article Number */}
        <div className="space-y-1">
          <Label htmlFor="entry-article" className="data-label">
            Article Number
          </Label>
          <Input
            id="entry-article"
            data-ocid="entry.article_input"
            type="text"
            placeholder="e.g. ART-2024-001"
            value={form.articleNo}
            onChange={handleChange("articleNo")}
            className="input-factory"
            style={
              errors.articleNo
                ? { borderColor: "oklch(var(--destructive))" }
                : {}
            }
          />
          {errors.articleNo && (
            <p
              className="text-xs font-medium"
              style={{ color: "oklch(var(--destructive))" }}
            >
              {errors.articleNo}
            </p>
          )}
        </div>

        {/* Master Name with datalist */}
        <div className="space-y-1">
          <Label htmlFor="entry-master" className="data-label">
            Master Name
          </Label>
          <Input
            id="entry-master"
            data-ocid="entry.master_input"
            type="text"
            list="master-names-list"
            placeholder="Type or select master name"
            value={form.masterName}
            onChange={handleChange("masterName")}
            className="input-factory"
            style={
              errors.masterName
                ? { borderColor: "oklch(var(--destructive))" }
                : {}
            }
          />
          <datalist id="master-names-list">
            {masterNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {errors.masterName && (
            <p
              className="text-xs font-medium"
              style={{ color: "oklch(var(--destructive))" }}
            >
              {errors.masterName}
            </p>
          )}
        </div>

        {/* Pcs Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="entry-dispatched" className="data-label">
              Pcs Dispatched
            </Label>
            <Input
              id="entry-dispatched"
              data-ocid="entry.dispatched_input"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={form.dispatchedPcs}
              onChange={handleChange("dispatchedPcs")}
              className="input-factory"
              style={
                errors.dispatchedPcs
                  ? { borderColor: "oklch(var(--destructive))" }
                  : {}
              }
            />
            {errors.dispatchedPcs && (
              <p
                className="text-xs font-medium"
                style={{ color: "oklch(var(--destructive))" }}
              >
                {errors.dispatchedPcs}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="entry-cut" className="data-label">
              Pcs Cut by Master
            </Label>
            <Input
              id="entry-cut"
              data-ocid="entry.cut_input"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={form.cutByMaster}
              onChange={handleChange("cutByMaster")}
              className="input-factory"
              style={
                errors.cutByMaster
                  ? { borderColor: "oklch(var(--destructive))" }
                  : {}
              }
            />
            {errors.cutByMaster && (
              <p
                className="text-xs font-medium"
                style={{ color: "oklch(var(--destructive))" }}
              >
                {errors.cutByMaster}
              </p>
            )}
          </div>
        </div>

        {/* Rate & Percentage Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="entry-rate" className="data-label">
              Rate per Piece (₨)
            </Label>
            <Input
              id="entry-rate"
              data-ocid="entry.rate_input"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              step="0.01"
              value={form.rate}
              onChange={handleChange("rate")}
              className="input-factory"
              style={
                errors.rate ? { borderColor: "oklch(var(--destructive))" } : {}
              }
            />
            {errors.rate && (
              <p
                className="text-xs font-medium"
                style={{ color: "oklch(var(--destructive))" }}
              >
                {errors.rate}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="entry-percentage" className="data-label">
              Percentage (%)
            </Label>
            <Input
              id="entry-percentage"
              data-ocid="entry.percentage_input"
              type="number"
              inputMode="decimal"
              placeholder="100"
              step="0.01"
              value={form.percentage}
              onChange={handleChange("percentage")}
              className="input-factory"
              style={
                errors.percentage
                  ? { borderColor: "oklch(var(--destructive))" }
                  : {}
              }
            />
            {errors.percentage && (
              <p
                className="text-xs font-medium"
                style={{ color: "oklch(var(--destructive))" }}
              >
                {errors.percentage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-2 pt-1">
        <Button
          data-ocid="entry.calculate_button"
          onClick={handleCalculate}
          className="w-full btn-factory"
          size="lg"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Calculate
        </Button>

        <Button
          data-ocid="entry.save_button"
          onClick={handleSave}
          disabled={addRecord.isPending}
          className="w-full btn-factory"
          size="lg"
          style={{
            background: "oklch(var(--success))",
            color: "oklch(var(--success-foreground))",
          }}
        >
          {addRecord.isPending ? (
            <>
              <span className="w-5 h-5 mr-2 inline-block border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Save Record
            </>
          )}
        </Button>

        <Button
          data-ocid="entry.clear_button"
          onClick={handleClear}
          variant="outline"
          className="w-full btn-factory"
          size="lg"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear Form
        </Button>

        {addRecord.isError && (
          <div
            data-ocid="entry.error_state"
            className="rounded-md p-3 text-sm font-medium"
            style={{
              background: "oklch(var(--destructive) / 0.1)",
              color: "oklch(var(--destructive))",
            }}
          >
            Failed to save record. Please try again.
          </div>
        )}
        {addRecord.isSuccess && (
          <div
            data-ocid="entry.success_state"
            className="rounded-md p-3 text-sm font-medium"
            style={{
              background: "oklch(var(--success) / 0.1)",
              color: "oklch(var(--success))",
            }}
          >
            Record saved successfully!
          </div>
        )}
      </div>

      {/* Formula Info */}
      <div
        className="rounded-lg p-3 text-xs space-y-1"
        style={{
          background: "oklch(var(--muted))",
          color: "oklch(var(--muted-foreground))",
        }}
      >
        <div
          className="font-semibold mb-1.5"
          style={{ fontFamily: "Cabinet Grotesk, sans-serif" }}
        >
          Calculation Formula
        </div>
        <div>Pending Pcs = Dispatched − Cut by Master</div>
        <div>Final Amount = Pcs Dispatched × Rate × Percentage ÷ 100</div>
      </div>
    </div>
  );
}
