import { LoaderCircle } from 'lucide-react';

function SubmitButton({ children, isLoading }) {
  return (
    <button className="button-primary w-full" type="submit" disabled={isLoading}>
      {isLoading ? <><LoaderCircle className="animate-spin" size={17} /> Please wait</> : children}
    </button>
  );
}

export default SubmitButton;
