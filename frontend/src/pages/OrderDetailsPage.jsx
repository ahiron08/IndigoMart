import { ArrowLeft, Package, Truck, CreditCard, MapPin, CheckCircle, AlertCircle, Loader2, Smartphone, Check, Image as ImageIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { getOrderById } from '@/services/orders.js';
import { formatCurrency } from '@/utils/format.js';
import { generateQR } from '@/services/payment.js';
import api from '@/services/api.js';

const statusSteps = [
  'Order Placed',
  'Confirmed',
  'Packed',
  'Picked Up',
  'In Transit',
  'Out for Delivery',
  'Delivered',
];

const statusColors = {
  'Order Placed': 'bg-indigo/10 text-indigo',
  'Confirmed': 'bg-emerald-100 text-emerald-700',
  'Packed': 'bg-blue-100 text-blue-700',
  'Picked Up': 'bg-amber-100 text-amber-700',
  'In Transit': 'bg-purple-100 text-purple-700',
  'Out for Delivery': 'bg-orange-100 text-orange-700',
  'Delivered': 'bg-emerald-100 text-emerald-700',
  'Cancelled': 'bg-clay/10 text-clay',
};

function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const payment = searchParams.get('payment');

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  const [utrSuccess, setUtrSuccess] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [screenshotError, setScreenshotError] = useState('');
  const screenshotInputRef = useRef(null);

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOrderById(id);
      setOrderData(data);
    } catch (err) {
      setError('Could not load order details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="mx-auto animate-spin text-indigo" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-clay/20 bg-clay/10 p-6 mt-8">
        <p className="text-sm font-medium text-clay">{error}</p>
        <button className="button-secondary mt-4" onClick={() => navigate('/orders')}>Back to Orders</button>
      </div>
    );
  }

  const { order, shipment } = orderData || {};

  if (!order) return null;

  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <div>
      {/* Success Banner */}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 mb-8">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-emerald-600" />
            <div>
              <h2 className="font-semibold text-emerald-800">Order Placed Successfully!</h2>
              <p className="text-sm text-emerald-600 mt-1">
                Order #{order.orderNumber}
                {payment === 'qr' && ' | Please complete payment via QR to confirm your order.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 border-b border-indigo/10 pb-6">
        <button className="icon-button" type="button" onClick={() => navigate('/orders')} aria-label="Back to orders">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="eyebrow text-clay">Order Details</p>
          <h1 className="mt-2 font-display text-4xl text-indigo">#{order.orderNumber}</h1>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {/* Order Status Timeline */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">
              <Package size={20} className="inline mr-2" />
              Order Status
            </h2>
            <div className="mt-6">
              {isCancelled ? (
                <div className="rounded-xl bg-clay/10 p-4 text-center">
                  <AlertCircle size={24} className="mx-auto text-clay" />
                  <p className="mt-2 font-medium text-clay">Order Cancelled</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    return (
                      <div key={step} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCompleted ? 'bg-indigo text-canvas' : 'bg-sand text-muted'
                          }`}>
                            {isCompleted ? '✓' : index + 1}
                          </div>
                          {index < statusSteps.length - 1 && (
                            <div className={`w-0.5 h-10 ${isCompleted && !isCurrent ? 'bg-indigo' : 'bg-sand'}`} />
                          )}
                        </div>
                        <div className={`pb-8 ${isCurrent ? 'font-semibold text-indigo' : isCompleted ? 'text-indigo/70' : 'text-muted'}`}>
                          <p className="text-sm">{step}</p>
                          {isCurrent && <p className="text-xs text-muted mt-0.5">Current status</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Delivery Address */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">
              <MapPin size={20} className="inline mr-2" />
              Delivery Address
            </h2>
            <div className="mt-4 text-sm">
              <p className="font-medium">{order.deliveryAddress?.recipientName}</p>
              <p className="text-muted mt-1">{order.deliveryAddress?.line1}</p>
              {order.deliveryAddress?.line2 && <p className="text-muted">{order.deliveryAddress.line2}</p>}
              {order.deliveryAddress?.landmark && <p className="text-muted">{order.deliveryAddress.landmark}</p>}
              <p className="text-muted">{order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}</p>
              <p className="text-muted mt-1">Phone: {order.deliveryAddress?.phone}</p>
            </div>
          </section>

          {/* Pickup Address */}
          {order.pickupAddress?.address && (
            <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
              <h2 className="font-display text-2xl text-indigo">
                <Truck size={20} className="inline mr-2" />
                Pickup Address (Seller)
              </h2>
              <div className="mt-4 text-sm">
                <p className="font-medium">{order.pickupAddress.fullName}</p>
                <p className="text-muted mt-1">{order.pickupAddress.address}</p>
                {order.pickupAddress.landmark && <p className="text-muted">{order.pickupAddress.landmark}</p>}
                <p className="text-muted">{order.pickupAddress.city}, {order.pickupAddress.state} - {order.pickupAddress.pincode}</p>
                {order.pickupAddress.phone && <p className="text-muted mt-1">Phone: {order.pickupAddress.phone}</p>}
              </div>
            </section>
          )}

          {/* Payment Info */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">
              <CreditCard size={20} className="inline mr-2" />
              Payment Information
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Method</span>
                <span className="font-medium">{order.payment?.method === 'COD' ? 'Cash on Delivery' : 'QR Payment'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status</span>
                <span className={`status-pill ${order.payment?.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : order.payment?.status === 'Verification Pending' ? 'bg-amber-100 text-amber-700' : 'bg-indigo/10 text-indigo'}`}>
                  {order.payment?.status}
                </span>
              </div>
              {order.payment?.utrNumber && (
                <div className="flex justify-between">
                  <span className="text-muted">UTR Number</span>
                  <span className="font-medium">{order.payment.utrNumber}</span>
                </div>
              )}
            </div>

            {/* QR Pay Button for unconfirmed orders */}
            {order.payment?.method === 'QR' && order.payment?.status !== 'Paid' && (
              <div className="mt-6 rounded-xl border border-indigo/10 bg-sand/30 p-6 text-center">
                <h3 className="font-display text-lg text-indigo">
                  <Smartphone size={18} className="inline mr-2" />
                  Complete Payment
                </h3>
                <p className="mt-1 text-xs text-muted">Scan the QR code to pay via any UPI app</p>

                {qrLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="animate-spin text-indigo" size={28} />
                  </div>
                ) : qrDataUrl ? (
                  <div className="mt-4 inline-block rounded-2xl bg-canvas p-4 shadow-sm">
                    <img src={qrDataUrl} alt="UPI QR Code" className="mx-auto" width="220" height="220" />
                    <p className="mt-3 text-sm font-medium">
                      Amount: <span className="text-indigo">{formatCurrency(order.pricing?.totalAmount)}</span>
                    </p>
                  </div>
                ) : (
                  <button className="button-secondary mt-4" onClick={async () => {
                    setQrLoading(true);
                    try {
                      const qr = await generateQR(order.pricing?.totalAmount, order.orderNumber);
                      setQrDataUrl(qr.dataUrl);
                    } catch { setError('Could not generate QR.'); }
                    setQrLoading(false);
                  }}>
                    <Smartphone size={16} className="mr-1" /> Show QR Code
                  </button>
                )}

                {qrDataUrl && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-left">UTR Number</label>
                      <input
                        className="form-input mt-1"
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        placeholder="Enter UTR number after payment"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-left">Payment Screenshot</label>
                      {!screenshotPreview ? (
                        <div
                          className="mt-1 rounded-xl border-2 border-dashed border-indigo/20 p-4 text-center transition hover:border-indigo/40 cursor-pointer"
                          onClick={() => screenshotInputRef.current?.click()}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') screenshotInputRef.current?.click(); }}
                          role="button"
                          tabIndex={0}
                        >
                          <input
                            ref={screenshotInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setScreenshotError('');
                              if (!file) {
                                setScreenshotFile(null);
                                setScreenshotPreview('');
                                return;
                              }
                              const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
                              if (!validTypes.includes(file.type)) {
                                setScreenshotError('Only JPEG, PNG, WebP, and AVIF images are accepted.');
                                setScreenshotFile(null);
                                setScreenshotPreview('');
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                setScreenshotError('Image must be smaller than 5MB.');
                                setScreenshotFile(null);
                                setScreenshotPreview('');
                                return;
                              }
                              setScreenshotFile(file);
                              setScreenshotPreview(URL.createObjectURL(file));
                            }}
                          />
                          <ImageIcon className="mx-auto text-muted" size={28} />
                          <p className="mt-2 text-xs font-medium">Click to upload payment screenshot</p>
                          <p className="mt-0.5 text-[10px] text-muted">JPEG, PNG, WebP, or AVIF up to 5MB</p>
                        </div>
                      ) : (
                        <div className="relative mt-1 overflow-hidden rounded-xl border border-indigo/10 bg-canvas">
                          <img src={screenshotPreview} alt="Payment screenshot preview" className="max-h-48 w-full object-contain" />
                          <button
                            type="button"
                            className="absolute top-2 right-2 rounded-full bg-canvas p-1.5 shadow"
                            onClick={() => {
                              if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
                              setScreenshotFile(null);
                              setScreenshotPreview('');
                              if (screenshotInputRef.current) screenshotInputRef.current.value = '';
                            }}
                            aria-label="Remove screenshot"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      {screenshotError && <p className="mt-1 text-xs text-clay" role="alert">{screenshotError}</p>}
                    </div>

                    <button
                      className="button-primary w-full"
                      disabled={utrSubmitting || (!utrInput.trim() && !screenshotFile)}
                      onClick={async () => {
                        if (!utrInput.trim() && !screenshotFile) return;
                        setUtrSubmitting(true);
                        setError('');
                        setUtrSuccess('');
                        try {
                          const formData = new FormData();
                          if (utrInput.trim()) formData.append('utrNumber', utrInput.trim());
                          if (screenshotFile) formData.append('paymentScreenshot', screenshotFile);
                          await api.patch(`orders/${id}/payment`, formData);
                          setUtrSuccess('Payment details submitted! Awaiting verification.');
                          await loadOrder();
                        } catch (err) {
                          setError(err.response?.data?.message || 'Could not submit payment details.');
                        }
                        setUtrSubmitting(false);
                      }}
                    >
                      {utrSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      {utrSubmitting ? 'Submitting...' : 'Submit for Verification'}
                    </button>
                    {utrSuccess && <p className="mt-2 text-xs text-emerald-600">{utrSuccess}</p>}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Shipping Info */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">
              <Truck size={20} className="inline mr-2" />
              Shipping Details
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              {order.shipping?.courierName && (
                <div className="flex justify-between">
                  <span className="text-muted">Courier</span>
                  <span className="font-medium">{order.shipping.courierName}</span>
                </div>
              )}
              {order.shipping?.trackingNumber && (
                <div className="flex justify-between">
                  <span className="text-muted">Tracking</span>
                  <span className="font-medium">{order.shipping.trackingNumber}</span>
                </div>
              )}
              {order.shipping?.estimatedDelivery && (
                <div className="flex justify-between">
                  <span className="text-muted">Est. Delivery</span>
                  <span className="font-medium">{new Date(order.shipping.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              )}
              {shipment && (
                <div className="flex justify-between">
                  <span className="text-muted">Shipping Cost</span>
                  <span className="font-medium">{formatCurrency(shipment.shippingCharge)}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-indigo/10 bg-canvas p-6 sticky top-8">
            <h3 className="font-display text-xl text-indigo">Order Summary</h3>

            {/* Items */}
            <div className="mt-4 space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex gap-4 border-b border-indigo/10 pb-4">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-16 w-16 rounded-xl object-cover bg-sand" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-sand flex items-center justify-center text-xs text-muted">No img</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                    <p className="text-xs text-muted mt-1">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium text-indigo mt-1">{formatCurrency(item.sellerPrice)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatCurrency(order.pricing?.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Platform Margin</span>
                <span className="text-indigo">+{formatCurrency(order.pricing?.platformMargin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Shipping</span>
                <span>+{formatCurrency(order.pricing?.shippingCost)}</span>
              </div>
              <div className="flex justify-between border-t border-indigo/10 pt-2 font-semibold text-base">
                <span>Total</span>
                <span className="text-indigo">{formatCurrency(order.pricing?.totalAmount)}</span>
              </div>
            </div>

            {/* Order Info */}
            <div className="mt-4 pt-4 border-t border-indigo/10 text-xs text-muted space-y-1">
              <p>Order #{order.orderNumber}</p>
              <p>Placed: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <span className={`status-pill ${statusColors[order.status] || 'bg-indigo/10 text-indigo'}`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsPage;