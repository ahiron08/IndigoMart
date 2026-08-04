import { ArrowLeft, CreditCard, Banknote, MapPin, Truck, Shield, Loader2, ShoppingBag, Smartphone, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

import { previewCheckout, placeOrder } from '@/services/checkout.js';
import { generateQR } from '@/services/payment.js';
import { getMyAddresses, createAddress } from '@/services/addresses.js';
import api from '@/services/api.js';
import { formatCurrency } from '@/utils/format.js';

function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product');
  const quantity = parseInt(searchParams.get('quantity')) || 1;

  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [error, setError] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    recipientName: '',
    phone: '',
    line1: '',
    line2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: true,
  });

  useEffect(() => {
    if (productId) {
      loadData();
    } else {
      loadCartForCheckout();
    }
  }, [productId]);

  const loadCartForCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/cart');
      const cart = response.data.data.cart;
      if (!cart?.items?.length) {
        navigate('/cart');
        return;
      }
      setCartItems(cart.items);
      // Load checkout for first product in cart
      const firstItem = cart.items[0];
      const addrList = await getMyAddresses().catch(() => []);
      setAddresses(addrList || []);
      const defaultAddr = addrList?.find((a) => a.isDefault) || addrList?.[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
        await loadPreview(defaultAddr.pincode, firstItem.product._id, firstItem.quantity);
      } else {
        setShowAddressForm(true);
        setLoading(false);
      }
    } catch (err) {
      setError('Could not load checkout data. Please try again.');
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [addrList] = await Promise.all([
        getMyAddresses(),
      ]);
      setAddresses(addrList || []);

      const defaultAddr = addrList?.find((a) => a.isDefault) || addrList?.[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
        await loadPreview(defaultAddr.pincode);
      } else {
        setShowAddressForm(true);
        setLoading(false);
      }
    } catch (err) {
      setError('Could not load checkout data. Please try again.');
      setLoading(false);
    }
  };

  const loadPreview = async (pincode, overrideProductId, overrideQuantity) => {
    try {
      setError('');
      const pid = overrideProductId || productId;
      const qty = overrideQuantity || quantity;
      const data = await previewCheckout({ productId: pid, quantity: qty, deliveryPincode: pincode });
      setCheckoutData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not calculate shipping.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = async (addressId) => {
    setSelectedAddressId(addressId);
    setLoading(true);
    const addr = addresses.find((a) => a._id === addressId);
    if (addr) await loadPreview(addr.pincode);
  };

  const handleAddressFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const newAddr = await createAddress(addressForm);
      const updatedAddresses = await getMyAddresses();
      setAddresses(updatedAddresses || []);
      setSelectedAddressId(newAddr._id);
      setShowAddressForm(false);
      await loadPreview(newAddr.pincode);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save address.');
    }
  };

  const getCheckoutProductId = () => {
    if (productId) return productId;
    if (cartItems.length > 0) return cartItems[0].product._id;
    return null;
  };

  const getCheckoutQuantity = () => {
    if (productId) return quantity;
    if (cartItems.length > 0) return cartItems[0].quantity;
    return 1;
  };

  const generateQrCode = async () => {
    if (!checkoutData) return;
    setQrLoading(true);
    setError('');
    try {
      const qr = await generateQR(checkoutData.pricing.totalAmount, '');
      setQrDataUrl(qr.dataUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate QR code.');
    } finally {
      setQrLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select a delivery address.');
      return;
    }
    const pid = getCheckoutProductId();
    const qty = getCheckoutQuantity();
    if (!pid) {
      setError('No product to order.');
      return;
    }
    setPlacing(true);
    setError('');
    try {
      const result = await placeOrder({
        productId: pid,
        quantity: qty,
        addressId: selectedAddressId,
        paymentMethod,
      });
      navigate(`/orders/${result.data?.order?._id || result.order?._id}?success=true`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const handleQRPayment = async () => {
    if (!selectedAddressId) {
      setError('Please select a delivery address.');
      return;
    }
    const pid = getCheckoutProductId();
    const qty = getCheckoutQuantity();
    if (!pid) {
      setError('No product to order.');
      return;
    }
    setPlacing(true);
    setError('');
    try {
      const result = await placeOrder({
        productId: pid,
        quantity: qty,
        addressId: selectedAddressId,
        paymentMethod: 'QR',
        paymentReference: utrNumber || undefined,
      });
      navigate(`/orders/${result.data?.order?._id || result.order?._id}?success=true&payment=qr`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-indigo" size={40} />
          <p className="mt-4 text-sm text-muted">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 border-b border-indigo/10 pb-6">
        <button className="icon-button" type="button" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="eyebrow text-clay">Checkout</p>
          <h1 className="mt-2 font-display text-4xl text-indigo">Complete your order</h1>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-clay/20 bg-clay/10 p-4">
          <p className="text-sm font-medium text-clay">{error}</p>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Delivery Address */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl text-indigo">
                  <MapPin size={20} className="inline mr-2" />
                  Delivery Address
                </h2>
                <p className="mt-1 text-sm text-muted">Where should we deliver your order?</p>
              </div>
              {!showAddressForm && addresses.length > 0 && (
                <button className="button-secondary text-sm" type="button" onClick={() => setShowAddressForm(true)}>
                  + Add New
                </button>
              )}
            </div>

            {showAddressForm ? (
              <form onSubmit={handleAddressFormSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium">Full Name *</label>
                    <input className="form-input mt-1" required value={addressForm.recipientName} onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })} placeholder="Recipient name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Phone *</label>
                    <input className="form-input mt-1" required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="Phone number" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium">Address Line 1 *</label>
                  <input className="form-input mt-1" required value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} placeholder="Street, building, apartment" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium">Address Line 2</label>
                    <input className="form-input mt-1" value={addressForm.line2} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} placeholder="Area, landmark" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Landmark</label>
                    <input className="form-input mt-1" value={addressForm.landmark} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} placeholder="Nearby landmark" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium">City *</label>
                    <input className="form-input mt-1" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="City" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">State *</label>
                    <input className="form-input mt-1" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} placeholder="State" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Pincode *</label>
                    <input className="form-input mt-1" required value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} placeholder="Pincode" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="button-primary">Save & Continue</button>
                  {addresses.length > 0 && (
                    <button type="button" className="button-secondary" onClick={() => setShowAddressForm(false)}>Cancel</button>
                  )}
                </div>
              </form>
            ) : (
              <div className="mt-6 space-y-3">
                {addresses.length === 0 ? (
                  <p className="text-sm text-muted">No addresses saved. Please add one.</p>
                ) : (
                  addresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={`block cursor-pointer rounded-xl border p-4 transition ${selectedAddressId === addr._id ? 'border-indigo bg-indigo/5' : 'border-indigo/10 hover:border-indigo/30'}`}
                    >
                      <input type="radio" name="address" value={addr._id} checked={selectedAddressId === addr._id} onChange={() => handleAddressSelect(addr._id)} className="hidden" />
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 ${selectedAddressId === addr._id ? 'border-indigo bg-indigo' : 'border-indigo/30'}`} />
                        <div>
                          <p className="font-medium text-sm">{addr.recipientName}</p>
                          <p className="text-xs text-muted mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                          <p className="text-xs text-muted">{addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="text-xs text-muted mt-1">Phone: {addr.phone}</p>
                          {addr.isDefault && <span className="status-pill bg-indigo/10 text-indigo text-[10px] mt-1">Default</span>}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </section>

          {/* Payment Method */}
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <h2 className="font-display text-2xl text-indigo">
              <CreditCard size={20} className="inline mr-2" />
              Payment Method
            </h2>
            <p className="mt-1 text-sm text-muted">Choose how you'd like to pay.</p>
            <div className="mt-6 space-y-3">
              <label className={`block cursor-pointer rounded-xl border p-4 transition ${paymentMethod === 'COD' ? 'border-indigo bg-indigo/5' : 'border-indigo/10 hover:border-indigo/30'}`}>
                <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="hidden" />
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${paymentMethod === 'COD' ? 'border-indigo bg-indigo' : 'border-indigo/30'}`} />
                  <Banknote size={20} className="text-indigo" />
                  <div>
                    <p className="font-medium text-sm">Cash on Delivery</p>
                    <p className="text-xs text-muted">Pay when you receive your order</p>
                  </div>
                </div>
              </label>
              <label className={`block cursor-pointer rounded-xl border p-4 transition ${paymentMethod === 'QR' ? 'border-indigo bg-indigo/5' : 'border-indigo/10 hover:border-indigo/30'}`}>
                <input type="radio" name="payment" value="QR" checked={paymentMethod === 'QR'} onChange={() => { setPaymentMethod('QR'); generateQrCode(); }} className="hidden" />
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${paymentMethod === 'QR' ? 'border-indigo bg-indigo' : 'border-indigo/30'}`} />
                  <Smartphone size={20} className="text-indigo" />
                  <div>
                    <p className="font-medium text-sm">Pay via QR</p>
                    <p className="text-xs text-muted">Scan QR code and pay via UPI</p>
                  </div>
                </div>
              </label>
            </div>

            {/* QR Code Display */}
            {paymentMethod === 'QR' && checkoutData && (
              <div className="mt-6 rounded-xl border border-indigo/10 bg-sand/30 p-6 text-center">
                <h3 className="font-display text-lg text-indigo">Scan to Pay</h3>
                <p className="mt-1 text-xs text-muted">Pay via any UPI app</p>

                {qrLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-indigo" size={32} />
                  </div>
                ) : qrDataUrl ? (
                  <div className="mt-4 inline-block rounded-2xl bg-canvas p-4 shadow-sm">
                    <img src={qrDataUrl} alt="UPI QR Code" className="mx-auto" width="250" height="250" />
                  </div>
                ) : (
                  <button className="button-secondary mt-4" onClick={generateQrCode}>
                    <Smartphone size={16} className="mr-1" /> Generate QR Code
                  </button>
                )}

                {qrDataUrl && (
                  <div className="mt-4 text-sm font-medium">
                    Amount: <span className="text-indigo">{formatCurrency(checkoutData.pricing.totalAmount)}</span>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-xs font-medium text-left">UTR Number (after payment)</label>
                  <input
                    className="form-input mt-1"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="Enter UTR number from your payment"
                  />
                  <p className="mt-1 text-xs text-muted text-left">Enter the UTR number you received after payment for verification.</p>
                </div>
              </div>
            )}
          </section>

          {/* Shipping Info */}
          {checkoutData?.shipping && (
            <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
              <h2 className="font-display text-2xl text-indigo">
                <Truck size={20} className="inline mr-2" />
                Shipping Information
              </h2>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Courier</span>
                  <span className="font-medium">{checkoutData.shipping.courierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Estimated Delivery</span>
                  <span className="font-medium">
                    {new Date(checkoutData.shipping.estimatedMin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' - '}
                    {new Date(checkoutData.shipping.estimatedMax).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {!checkoutData.serviceability?.isServiceable && (
                  <div className="rounded-xl bg-clay/10 p-3 text-xs text-clay mt-3">
                    <Shield size={14} className="inline mr-1" />
                    {checkoutData.serviceability?.message || 'Delivery may not be available to this pincode.'}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Order Summary (Mobile) */}
          {checkoutData && (
            <div className="lg:hidden">
              <OrderSummaryCard checkoutData={checkoutData} />
            </div>
          )}

          {/* Place Order Button (Mobile) */}
          <div className="lg:hidden">
            {paymentMethod === 'COD' ? (
              <button className="button-primary w-full" onClick={handlePlaceOrder} disabled={placing || !selectedAddressId}>
                {placing ? <Loader2 size={18} className="animate-spin inline mr-2" /> : null}
                Place Order - {checkoutData ? formatCurrency(checkoutData.pricing.totalAmount) : ''}
              </button>
            ) : (
              <button className="button-primary w-full" onClick={handleQRPayment} disabled={placing || !selectedAddressId}>
                {placing ? <Loader2 size={18} className="animate-spin inline mr-2" /> : null}
                Proceed to Pay - {checkoutData ? formatCurrency(checkoutData.pricing.totalAmount) : ''}
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Summary (Desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-8 space-y-6">
            {checkoutData && <OrderSummaryCard checkoutData={checkoutData} />}

            {paymentMethod === 'COD' ? (
              <button className="button-primary w-full" onClick={handlePlaceOrder} disabled={placing || !selectedAddressId}>
                {placing ? <Loader2 size={18} className="animate-spin inline mr-2" /> : null}
                Place Order - {checkoutData ? formatCurrency(checkoutData.pricing.totalAmount) : ''}
              </button>
            ) : (
              <button className="button-primary w-full" onClick={handleQRPayment} disabled={placing || !selectedAddressId}>
                {placing ? <Loader2 size={18} className="animate-spin inline mr-2" /> : null}
                Proceed to Pay - {checkoutData ? formatCurrency(checkoutData.pricing.totalAmount) : ''}
              </button>
            )}

            <div className="rounded-2xl border border-indigo/10 bg-canvas p-4">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Shield size={14} />
                <span>Your information is secure and will not be shared.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderSummaryCard({ checkoutData }) {
  return (
    <div className="rounded-2xl border border-indigo/10 bg-canvas p-6">
      <h3 className="font-display text-xl text-indigo">Order Summary</h3>

      {/* Product */}
      <div className="mt-4 flex gap-4 border-b border-indigo/10 pb-4">
        {checkoutData.product?.image ? (
          <img src={checkoutData.product.image} alt={checkoutData.product.title} className="h-20 w-20 rounded-xl object-cover bg-sand" />
        ) : (
          <div className="h-20 w-20 rounded-xl bg-sand flex items-center justify-center text-xs text-muted">No img</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm line-clamp-2">{checkoutData.product.title}</p>
          <p className="text-xs text-muted mt-1">Qty: {checkoutData.quantity}</p>
          <p className="text-sm font-medium text-indigo mt-1">{formatCurrency(checkoutData.product.price)}</p>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span>{formatCurrency(checkoutData.pricing.customerSubtotal ?? checkoutData.pricing.sellerPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Shipping Cost</span>
          <span>+{formatCurrency(checkoutData.pricing.shippingCost)}</span>
        </div>
        <div className="flex justify-between border-t border-indigo/10 pt-2 font-semibold text-base">
          <span>Total</span>
          <span className="text-indigo">{formatCurrency(checkoutData.pricing.totalAmount)}</span>
        </div>
      </div>

      {/* Shipping Info */}
      <div className="mt-4 rounded-xl bg-sand/50 p-3 text-xs space-y-1">
        <p className="text-muted">
          <Truck size={12} className="inline mr-1" />
          {checkoutData.shipping.courierName}
        </p>
        <p className="text-muted">
          Delivery: {new Date(checkoutData.shipping.estimatedMin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          {' - '}
          {new Date(checkoutData.shipping.estimatedMax).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
        {checkoutData.seller?.shopName && (
          <p className="text-muted">Sold by: {checkoutData.seller.shopName}</p>
        )}
      </div>
    </div>
  );
}

export default CheckoutPage;