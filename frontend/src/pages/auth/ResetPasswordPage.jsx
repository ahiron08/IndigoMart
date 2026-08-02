import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import FormField from '@/components/forms/FormField.jsx';
import SubmitButton from '@/components/forms/SubmitButton.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import api from '@/services/api.js';
import { getApiError } from '@/utils/api-error.js';

const password = z.string().min(8, 'Use at least 8 characters.').max(72)
  .regex(/[a-z]/, 'Add a lowercase letter.').regex(/[A-Z]/, 'Add an uppercase letter.').regex(/\d/, 'Add a number.');
const schema = z.object({ password, passwordConfirm: z.string() }).refine(
  (values) => values.password === values.passwordConfirm,
  { message: 'Passwords do not match.', path: ['passwordConfirm'] },
);

function ResetPasswordPage() {
  const [formError, setFormError] = useState('');
  const { token } = useParams();
  const { restoreSession } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema), defaultValues: { password: '', passwordConfirm: '' },
  });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await api.patch(`/auth/reset-password/${token}`, values);
      await restoreSession();
      navigate('/profile', { replace: true });
    } catch (error) {
      setFormError(getApiError(error, 'This reset link may be invalid or expired.').message);
    }
  };

  return (
    <div className="w-full">
      <p className="eyebrow text-clay">Choose carefully</p>
      <h1 className="mt-4 font-display text-5xl text-indigo">Set a new password.</h1>
      <p className="mt-4 text-sm leading-6 text-muted">Use at least eight characters with upper and lowercase letters and a number.</p>
      {formError && <div className="form-alert" role="alert">{formError}</div>}
      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="New password" type="password" autoComplete="new-password" placeholder="Your new password" registration={register('password')} error={errors.password} />
        <FormField label="Confirm password" type="password" autoComplete="new-password" placeholder="Repeat your new password" registration={register('passwordConfirm')} error={errors.passwordConfirm} />
        <SubmitButton isLoading={isSubmitting}>Update password</SubmitButton>
      </form>
    </div>
  );
}

export default ResetPasswordPage;
