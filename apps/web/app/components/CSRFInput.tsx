interface CSRFInputProps {
  token: string;
}

/**
 * CSRFInput component - adds hidden CSRF token to forms
 * 
 * Usage:
 * In a Form component, add CSRFInput with the token prop
 * to include the CSRF token as a hidden field
 */
export default function CSRFInput({ token }: CSRFInputProps) {
  return <input type="hidden" name="__csrf" value={token} />;
}
