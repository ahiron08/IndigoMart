import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import FormField from '@/components/forms/FormField.jsx';
import SubmitButton from '@/components/forms/SubmitButton.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { getApiError } from '@/utils/api-error.js';

const password = z.string().min(8, 'Use at least 8 characters.').max(72)
  .regex(/[a-z]/, 'Add a lowercase letter.')
  .regex(/[A-Z]/, 'Add an uppercase letter.')
  .regex(/\d/, 'Add a number.');

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(100),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z.string().trim().max(20).optional(),
  password,
  passwordConfirm: z.string(),
  terms: z.literal(true, { errorMap: () => ({ message: 'Please accept the terms to continue.' }) }),
}).refine((values) => values.password === values.passwordConfirm, {
  message: 'Passwords do not match.', path: ['passwordConfirm'],
});

function SignupPage() {
  const [formError, setFormError] = useState('');
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', password: '', passwordConfirm: '', terms: false },
  });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await createAccount({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        passwordConfirm: values.passwordConfirm,
      });
      navigate('/profile', { replace: true });
    } catch (error) {
      const apiError = getApiError(error, 'We could not create your account.');
      Object.entries(apiError.fields).forEach(([field, message]) => setError(field, { message }));
      setFormError(apiError.message);
    }
  };

  return (
    <div className="w-full py-4">
      <p className="eyebrow text-clay">Join the marketplace</p>
      <h1 className="mt-4 font-display text-5xl tracking-tight text-indigo">Create your account.</h1>
      <p className="mt-4 text-sm leading-6 text-muted">Save favourites, follow orders, and meet independent makers.</p>
      {formError && <div className="form-alert" role="alert">{formError}</div>}
      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Full name" autoComplete="name" placeholder="Your name" registration={register('name')} error={errors.name} />
        <FormField label="Email address" type="email" autoComplete="email" placeholder="you@example.com" registration={register('email')} error={errors.email} />
        <FormField label="Phone" hint="Optional" type="tel" autoComplete="tel" placeholder="+91" registration={register('phone')} error={errors.phone} />
        <FormField label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" registration={register('password')} error={errors.password} />
        <FormField label="Confirm password" type="password" autoComplete="new-password" placeholder="Repeat your password" registration={register('passwordConfirm')} error={errors.passwordConfirm} />
        <label className="flex items-start gap-3 text-xs leading-5 text-muted">
          <input className="mt-1 accent-indigo" type="checkbox" {...register('terms')} />
          <span>I agree to the Terms of Use and Privacy Policy.</span>
        </label>
        {errors.terms && <p className="text-xs text-clay" role="alert">{errors.terms.message}</p>}
        <SubmitButton isLoading={isSubmitting}>Create account</SubmitButton>
      </form>
      <p className="mt-7 text-center text-xs text-muted">Already have an account? <Link className="font-semibold text-indigo hover:underline" to="/login">Sign in</Link></p>
    </div>
  );
}

export default SignupPage;
