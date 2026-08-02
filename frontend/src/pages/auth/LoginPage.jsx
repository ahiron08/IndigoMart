import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import FormField from '@/components/forms/FormField.jsx';
import SubmitButton from '@/components/forms/SubmitButton.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { getApiError } from '@/utils/api-error.js';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

const destinationFor = (user, requestedPath) => {
  if (requestedPath) return requestedPath;
  if (user.role === 'admin') return '/admin';
  if (user.role === 'seller' || user.role === 'creator') return '/seller/dashboard';
  if (user.role === 'customer') return '/';
  return '/profile';
};

function LoginPage() {
  const [formError, setFormError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = location.state?.from?.pathname;
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (user) navigate(destinationFor(user, requestedPath), { replace: true });
  }, [user, requestedPath, navigate]);

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const signedInUser = await login(values);
      navigate(destinationFor(signedInUser, requestedPath), { replace: true });
    } catch (error) {
      const apiError = getApiError(error, 'We could not sign you in.');
      Object.entries(apiError.fields).forEach(([field, message]) => setError(field, { message }));
      setFormError(apiError.message);
    }
  };

  return (
    <div className="w-full">
      <p className="eyebrow text-clay">Welcome back</p>
      <h1 className="mt-4 font-display text-5xl tracking-tight text-indigo">Sign in to IndigoMart.</h1>
      <p className="mt-4 text-sm leading-6 text-muted">Return to your saved pieces, orders, and marketplace.</p>
      {formError && <div className="form-alert" role="alert">{formError}</div>}
      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Email address" type="email" autoComplete="email" placeholder="you@example.com" registration={register('email')} error={errors.email} />
        <FormField label="Password" type="password" autoComplete="current-password" placeholder="Your password" registration={register('password')} error={errors.password} />
        <div className="flex justify-end"><Link className="text-xs font-medium text-clay hover:underline" to="/forgot-password">Forgot password?</Link></div>
        <SubmitButton isLoading={isSubmitting}>Sign in</SubmitButton>
      </form>
      <p className="mt-7 text-center text-xs text-muted">New here? <Link className="font-semibold text-indigo hover:underline" to="/signup">Create an account</Link></p>
    </div>
  );
}

export default LoginPage;