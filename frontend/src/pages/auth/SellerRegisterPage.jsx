import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Image as ImageIcon, X } from 'lucide-react';

import FormField from '@/components/forms/FormField.jsx';
import SubmitButton from '@/components/forms/SubmitButton.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { getApiError } from '@/utils/api-error.js';

const password = z.string().min(8, 'Use at least 8 characters.').max(72)
  .regex(/[a-z]/, 'Add a lowercase letter.')
  .regex(/[A-Z]/, 'Add an uppercase letter.')
  .regex(/\d/, 'Add a number.');

const GOVT_ID_TYPES = ['Aadhaar', 'PAN', 'Voter ID', 'Passport', 'Driving Licence'];

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(100),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().max(20).optional(),
  password,
  passwordConfirm: z.string(),
  shopName: z.string().trim().min(2, 'Enter your shop name.').max(100),
  businessType: z.string().trim().min(2, 'Enter your business type.').max(100),
  gstNumber: z.string().trim().max(50).optional(),
  panNumber: z.string().trim().max(50).optional(),
  shopAddress: z.string().trim().min(5, 'Enter your shop address.').max(500),
  city: z.string().trim().min(2, 'Enter your city.').max(100),
  state: z.string().trim().min(2, 'Enter your state.').max(100),
  pinCode: z.string().trim().min(3, 'Enter your PIN code.').max(20),
  shopDescription: z.string().trim().max(2000).optional(),
  accountHolderName: z.string().trim().min(2, 'Enter account holder name.').max(100),
  bankName: z.string().trim().min(2, 'Enter bank name.').max(100),
  accountNumber: z.string().trim().min(1, 'Enter account number.').max(50),
  ifscCode: z.string().trim().min(1, 'Enter IFSC code.').max(20),
  govtIdType: z.enum(GOVT_ID_TYPES, { errorMap: () => ({ message: 'Select a valid government ID type.' }) }),
  govtIdNumber: z.string().trim().min(2, 'Enter your government ID number.').max(100),
  terms: z.literal(true, { errorMap: () => ({ message: 'Please accept the terms to continue.' }) }),
}).refine((values) => values.password === values.passwordConfirm, {
  message: 'Passwords do not match.', path: ['passwordConfirm'],
});

function SellerRegisterPage() {
  const [formError, setFormError] = useState('');
  const [govtIdFile, setGovtIdFile] = useState(null);
  const [govtIdPreview, setGovtIdPreview] = useState('');
  const [govtIdError, setGovtIdError] = useState('');
  const fileInputRef = useRef(null);
  const { registerSeller } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', email: '', phone: '', password: '', passwordConfirm: '',
      shopName: '', businessType: '', gstNumber: '', panNumber: '',
      shopAddress: '', city: '', state: '', pinCode: '', shopDescription: '',
      accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '',
      govtIdType: '', govtIdNumber: '',
      terms: false,
    },
  });

  const handleGovtIdChange = (event) => {
    const file = event.target.files?.[0];
    setGovtIdError('');
    if (!file) {
      setGovtIdFile(null);
      setGovtIdPreview('');
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setGovtIdError('Only JPEG, PNG, WebP, and AVIF images are accepted.');
      setGovtIdFile(null);
      setGovtIdPreview('');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setGovtIdError('Image must be smaller than 5MB.');
      setGovtIdFile(null);
      setGovtIdPreview('');
      return;
    }
    setGovtIdFile(file);
    setGovtIdPreview(URL.createObjectURL(file));
  };

  const removeGovtId = () => {
    if (govtIdPreview) URL.revokeObjectURL(govtIdPreview);
    setGovtIdFile(null);
    setGovtIdPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (values) => {
    setFormError('');
    if (!govtIdFile) {
      setGovtIdError('A government ID image is required for verification.');
      return;
    }
    try {
      await registerSeller({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        passwordConfirm: values.passwordConfirm,
        shopName: values.shopName,
        businessType: values.businessType,
        gstNumber: values.gstNumber || undefined,
        panNumber: values.panNumber || undefined,
        shopAddress: values.shopAddress,
        city: values.city,
        state: values.state,
        pinCode: values.pinCode,
        shopDescription: values.shopDescription || undefined,
        accountHolderName: values.accountHolderName,
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        ifscCode: values.ifscCode,
        govtIdType: values.govtIdType,
        govtIdNumber: values.govtIdNumber,
        govtIdImage: govtIdFile,
      });
      navigate('/seller/dashboard', { replace: true });
    } catch (error) {
      const apiError = getApiError(error, 'We could not create your seller account.');
      Object.entries(apiError.fields).forEach(([field, message]) => setError(field, { message }));
      setFormError(apiError.message);
    }
  };

  return (
    <div className="w-full py-4">
      <p className="eyebrow text-clay">Seller registration</p>
      <h1 className="mt-4 font-display text-5xl tracking-tight text-indigo">Open your shop.</h1>
      <p className="mt-4 text-sm leading-6 text-muted">List products, manage orders, and grow your business on IndigoMart.</p>
      {formError && <div className="form-alert" role="alert">{formError}</div>}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <fieldset>
          <legend className="font-display text-xl text-indigo mb-4">Personal Information</legend>
          <div className="space-y-4">
            <FormField label="Full name" autoComplete="name" placeholder="Your name" registration={register('name')} error={errors.name} />
            <FormField label="Email address" type="email" autoComplete="email" placeholder="you@example.com" registration={register('email')} error={errors.email} />
            <FormField label="Phone" hint="Optional" type="tel" autoComplete="tel" placeholder="+91" registration={register('phone')} error={errors.phone} />
            <FormField label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" registration={register('password')} error={errors.password} />
            <FormField label="Confirm password" type="password" autoComplete="new-password" placeholder="Repeat your password" registration={register('passwordConfirm')} error={errors.passwordConfirm} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-xl text-indigo mb-4">Business Information</legend>
          <div className="space-y-4">
            <FormField label="Shop name" placeholder="Your brand or shop name" registration={register('shopName')} error={errors.shopName} />
            <FormField label="Business type" placeholder="e.g. Sole Proprietorship, Pvt Ltd" registration={register('businessType')} error={errors.businessType} />
            <FormField label="GST Number" hint="Optional" placeholder="GSTIN" registration={register('gstNumber')} error={errors.gstNumber} />
            <FormField label="PAN Number" hint="Optional" placeholder="PAN" registration={register('panNumber')} error={errors.panNumber} />
            <FormField label="Shop address" placeholder="Street address" registration={register('shopAddress')} error={errors.shopAddress} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="City" placeholder="City" registration={register('city')} error={errors.city} />
              <FormField label="State" placeholder="State" registration={register('state')} error={errors.state} />
            </div>
            <FormField label="PIN code" placeholder="PIN code" registration={register('pinCode')} error={errors.pinCode} />
            <FormField label="Shop description" hint="Optional" placeholder="Describe your shop" registration={register('shopDescription')} error={errors.shopDescription} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-xl text-indigo mb-4">Bank Details</legend>
          <div className="space-y-4">
            <FormField label="Account holder name" placeholder="Name on bank account" registration={register('accountHolderName')} error={errors.accountHolderName} />
            <FormField label="Bank name" placeholder="Name of your bank" registration={register('bankName')} error={errors.bankName} />
            <FormField label="Account number" placeholder="Bank account number" registration={register('accountNumber')} error={errors.accountNumber} />
            <FormField label="IFSC code" placeholder="IFSC code" registration={register('ifscCode')} error={errors.ifscCode} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-xl text-indigo mb-4">Government ID Verification</legend>
          <p className="text-xs leading-5 text-muted">Upload a valid government-issued ID to verify that you are an adult. This is required for seller approval.</p>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-medium text-indigo">
                ID type
              </span>
              <select
                className={`form-input ${errors.govtIdType ? 'form-input-error' : ''}`}
                {...register('govtIdType')}
                aria-invalid={Boolean(errors.govtIdType)}
                defaultValue=""
              >
                <option value="" disabled>Select ID type</option>
                {GOVT_ID_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.govtIdType && <span className="mt-1.5 block text-xs text-clay" role="alert">{errors.govtIdType.message}</span>}
            </label>
            <FormField label="ID number" placeholder="Enter your government ID number" registration={register('govtIdNumber')} error={errors.govtIdNumber} />

            <div>
              <span className="mb-2 flex items-center justify-between text-xs font-medium text-indigo">
                Government ID image
              </span>
              {!govtIdPreview ? (
                <div
                  className="relative rounded-2xl border-2 border-dashed border-indigo/20 p-6 text-center transition hover:border-indigo/40"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                  role="button"
                  tabIndex={0}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={handleGovtIdChange}
                  />
                  <ImageIcon className="mx-auto text-muted" size={36} />
                  <p className="mt-3 text-sm font-medium">Click to upload ID image</p>
                  <p className="mt-1 text-xs text-muted">JPEG, PNG, WebP, or AVIF up to 5MB</p>
                </div>
              ) : (
                <div className="relative rounded-2xl border border-indigo/10 overflow-hidden bg-sand/30">
                  <img src={govtIdPreview} alt="Government ID preview" className="max-h-64 w-full object-contain" />
                  <button
                    type="button"
                    className="absolute top-2 right-2 rounded-full bg-canvas p-2 shadow"
                    onClick={removeGovtId}
                    aria-label="Remove ID image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {govtIdError && <span className="mt-1.5 block text-xs text-clay" role="alert">{govtIdError}</span>}
            </div>
          </div>
        </fieldset>

        <label className="flex items-start gap-3 text-xs leading-5 text-muted">
          <input className="mt-1 accent-indigo" type="checkbox" {...register('terms')} />
          <span>I agree to the Terms of Use, Seller Agreement, and Privacy Policy.</span>
        </label>
        {errors.terms && <p className="text-xs text-clay" role="alert">{errors.terms.message}</p>}
        <SubmitButton isLoading={isSubmitting}>Create seller account</SubmitButton>
      </form>
      <p className="mt-7 text-center text-xs text-muted">Already have an account? <Link className="font-semibold text-indigo hover:underline" to="/login">Sign in</Link></p>
    </div>
  );
}

export default SellerRegisterPage;
