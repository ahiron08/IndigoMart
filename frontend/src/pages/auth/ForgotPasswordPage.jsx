import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import FormField from '@/components/forms/FormField.jsx';
import SubmitButton from '@/components/forms/SubmitButton.jsx';
import api from '@/services/api.js';
import { getApiError } from '@/utils/api-error.js';

const schema = z.object({ email: z.string().trim().email('Enter a valid email address.') });

function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState('');
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema), defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }) => {
    setFormError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSentTo(email);
    } catch (error) {
      setFormError(getApiError(error, 'We could not send reset instructions.').message);
    }
  };

  if (sentTo) {
    return (
      <div className="w-full text-center">
        <CheckCircle2 className="mx-auto text-clay" size={42} />
        <h1 className="mt-6 font-display text-5xl text-indigo">Check your inbox.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">If an account exists for <strong className="text-indigo">{sentTo}</strong>, a reset link is on its way.</p>
        <Link className="button-secondary mt-8" to="/login">Return to sign in</Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="eyebrow text-clay">Account recovery</p>
      <h1 className="mt-4 font-display text-5xl text-indigo">Forgot your password?</h1>
      <p className="mt-4 text-sm leading-6 text-muted">Enter your email and we will send a secure link that expires in 15 minutes.</p>
      {formError && <div className="form-alert" role="alert">{formError}</div>}
      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Email address" type="email" autoComplete="email" placeholder="you@example.com" registration={register('email')} error={errors.email} />
        <SubmitButton isLoading={isSubmitting}>Send reset link</SubmitButton>
      </form>
      <p className="mt-7 text-center text-xs text-muted"><Link className="font-semibold text-indigo hover:underline" to="/login">Back to sign in</Link></p>
    </div>
  );
}

export default ForgotPasswordPage;
