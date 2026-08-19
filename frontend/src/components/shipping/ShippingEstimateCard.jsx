import { Truck, Loader2, AlertCircle, Check } from 'lucide-react';
import { formatCurrency } from '@/utils/format.js';

/**
 * ShippingEstimateCard — displays an *estimated* delivery charge computed by
 * the store's internal rate engine.
 *
 * The label intentionally reads "Estimated delivery charge" (not a courier's
 * exact rate) because the internal calculator only produces a store-defined
 * estimate until a real courier provider is plugged in.
 *
 * @param {object} props
 * @param {boolean} props.loading
 * @param {string|null} props.error
 * @param {object|null} props.estimate - shape from POST /shipping/calculate
 */
export function ShippingEstimateCard({ loading, error, estimate }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-indigo/10 bg-canvas p-4 text-sm text-muted flex items-center gap-2">
        <Loader2 size={16} className="animate-spin" />
        Checking delivery…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Delivery estimate unavailable</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!estimate) return null;

  const { shipping, breakdown } = estimate;
  const days = shipping?.estimatedDeliveryDays;
  const dayLabel =
    days && days.min === days.max
      ? `${days.min} business day`
      : days && `${days.min}–${days.max} business days`;

  return (
    <div className="rounded-2xl border border-indigo/10 bg-canvas p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check size={16} />
          </span>
          <div>
            <p className="font-medium text-sm text-indigo">Delivery available</p>
            <p className="text-xs text-muted">{dayLabel || '3–5 business days'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Estimated delivery charge</p>
          <p className="text-lg font-semibold text-indigo">
            {formatCurrency(shipping?.charge ?? 0, shipping?.currency)}
          </p>
        </div>
      </div>

      {breakdown && (
        <div className="mt-3 border-t border-indigo/10 pt-3 space-y-1 text-xs text-muted">
          <div className="flex justify-between">
            <span>Zone</span>
            <span className="font-medium text-ink">{breakdown.zone}</span>
          </div>
          <div className="flex justify-between">
            <span>Chargeable weight</span>
            <span className="font-medium text-ink">{breakdown.chargeableWeight} kg</span>
          </div>
          {breakdown.cod > 0 && (
            <div className="flex justify-between">
              <span>COD charge</span>
              <span className="font-medium text-ink">{formatCurrency(breakdown.cod)}</span>
            </div>
          )}
          {breakdown.remoteSurcharge > 0 && (
            <div className="flex justify-between">
              <span>Remote-area surcharge</span>
              <span className="font-medium text-ink">{formatCurrency(breakdown.remoteSurcharge)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>GST</span>
            <span className="font-medium text-ink">{formatCurrency(breakdown.tax)}</span>
          </div>
        </div>
      )}

      {shipping?.isEstimate !== false && (
        <p className="mt-2 text-[11px] text-muted flex items-center gap-1">
          <Truck size={11} />
          Internal estimate — final amount is confirmed at checkout
        </p>
      )}
    </div>
  );
}

export default ShippingEstimateCard;