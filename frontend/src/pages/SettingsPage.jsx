import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Building2, LogOut, Package, Shield, ShoppingBag, ShoppingCart, Tag, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import FormField from '@/components/forms/FormField.jsx';
import SubmitButton from '@/components/forms/SubmitButton.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import api from '@/services/api.js';
import { getApiError } from '@/utils/api-error.js';

const shopSchema = z.object({
  shopName: z.string().trim().min(2, 'Shop name must be at least 2 characters.').max(100, 'Shop name is too long.'),
  shopDescription: z.string().trim().max(2000, 'Description is too long.').optional().default(''),
  website: z.string().trim().url('Enter a valid URL.').optional().or(z.literal('')),
  instagram: z.string().trim().url('Enter a valid URL.').optional().or(z.literal('')),
  facebook: z.string().trim().url('Enter a valid URL.').optional().or(z.literal('')),
});

function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const isSeller = user?.role === 'seller';

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      shopName: user?.shopName || '',
      shopDescription: user?.shopDescription || '',
      website: user?.socialLinks?.website || '',
      instagram: user?.socialLinks?.instagram || '',
      facebook: user?.socialLinks?.facebook || '',
    },
  });

  useEffect(() => {
    reset({
      shopName: user?.shopName || '',
      shopDescription: user?.shopDescription || '',
      website: user?.socialLinks?.website || '',
      instagram: user?.socialLinks?.instagram || '',
      facebook: user?.socialLinks?.facebook || '',
    });
  }, [user, reset]);

  const onSubmit = async (values) => {
    setFormError('');
    setFormSuccess('');
    try {
      const payload = {
        shopName: values.shopName,
        shopDescription: values.shopDescription,
        socialLinks: {
          website: values.website || '',
          instagram: values.instagram || '',
          facebook: values.facebook || '',
        },
      };
      await api.put('/seller/profile', payload);
      setFormSuccess('Shop profile updated successfully.');
    } catch (error) {
      const apiError = getApiError(error, 'Could not update shop profile.');
      setFormError(apiError.message);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const quickLinks = [
    ...(user?.role === 'seller' ? [['My Products', 'my-products', Package]] : []),
    ...(user?.role === 'creator' ? [['Inventory', 'inventory', Package]] : []),
    ['Orders', 'orders', ShoppingBag],
    ['Analytics', 'analytics', TrendingUp],
    ...(user?.role === 'admin' ? [['Users', 'users', Shield], ['Categories', 'categories', Building2]] : []),
    ['Wishlist', '/wishlist', Tag],
    ['Cart', '/cart', ShoppingCart],
    ['Shop', '/shop', ShoppingBag],
  ];

  return (
    <div>
      <p className="eyebrow text-clay">Workspace</p>
      <h1 className="mt-3 font-display text-5xl text-indigo">Settings</h1>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-indigo">Account</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-indigo/10 bg-canvas p-6">
            <p className="text-sm text-muted">Name</p>
            <p className="mt-2 font-medium text-indigo">{user?.name}</p>
          </article>
          <article className="rounded-2xl border border-indigo/10 bg-canvas p-6">
            <p className="text-sm text-muted">Email</p>
            <p className="mt-2 truncate font-medium text-indigo">{user?.email}</p>
          </article>
          <article className="rounded-2xl border border-indigo/10 bg-canvas p-6">
            <p className="text-sm text-muted">Role</p>
            <p className="mt-2"><span className="status-pill">{user?.role}</span></p>
          </article>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-indigo">Quick links</h2>
        <p className="mt-2 text-sm text-muted">Jump to the pages you use most.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quickLinks.map(([label, to, Icon]) => (
            <Link key={label} to={to} className="group flex items-center justify-between rounded-2xl border border-indigo/10 bg-canvas p-5 transition hover:border-clay/40">
              <div className="flex items-center gap-3"><Icon size={18} className="text-clay" /><span className="text-sm font-medium text-indigo">{label}</span></div>
              <ArrowRight size={15} className="text-muted transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      {isSeller && (
        <section className="mt-10">
          <h2 className="font-display text-2xl text-indigo">Shop profile</h2>
          <p className="mt-2 text-sm text-muted">Update how your shop appears to customers.</p>
          {formError && <div className="form-alert mt-4" role="alert">{formError}</div>}
          {formSuccess && <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status">{formSuccess}</div>}
          <form className="mt-4 space-y-5 rounded-2xl border border-indigo/10 bg-canvas p-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField label="Shop name" placeholder="Your shop name" registration={register('shopName')} error={errors.shopName} />
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-medium text-indigo">Description</span>
              <textarea
                {...register('shopDescription')}
                className="form-input min-h-24 resize-y"
                placeholder="Tell customers about your shop"
                rows={3}
              />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Website" placeholder="https://" registration={register('website')} error={errors.website} />
              <FormField label="Instagram" placeholder="https://" registration={register('instagram')} error={errors.instagram} />
            </div>
            <FormField label="Facebook" placeholder="https://" registration={register('facebook')} error={errors.facebook} />
            <SubmitButton isLoading={isSubmitting}>{isDirty ? 'Save changes' : 'Saved'}</SubmitButton>
          </form>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-2xl text-indigo">Security</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <article className="flex items-center justify-between rounded-2xl border border-indigo/10 bg-canvas p-6">
            <div className="flex items-center gap-3"><Shield size={18} className="text-clay" /><div><p className="text-sm font-medium text-indigo">Password</p><p className="text-xs text-muted">Reset via email link</p></div></div>
            <Link className="text-xs font-medium text-clay hover:underline" to="/forgot-password">Reset <ArrowRight size={13} className="inline" /></Link>
          </article>
          <article className="flex items-center justify-between rounded-2xl border border-indigo/10 bg-canvas p-6">
            <div className="flex items-center gap-3"><LogOut size={18} className="text-clay" /><div><p className="text-sm font-medium text-indigo">Sign out</p><p className="text-xs text-muted">End your current session</p></div></div>
            <button className="text-xs font-medium text-clay hover:underline" type="button" onClick={handleSignOut}>Sign out <ArrowRight size={13} className="inline" /></button>
          </article>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;