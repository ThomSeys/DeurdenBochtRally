interface CSRFInputProps {
  token: string;
}

/**
 * CSRFInput component - adds hidden CSRF token to forms
 * 
 * Usage:
 * <Form method="post">
 *   <CSRFInput token={csrfToken} />
 *   {/* form fields */}
 * </Form>
 */
export default function CSRFInput({ token }: CSRFInputProps) {
  return <input type="hidden" name="__csrf" value={token} />;
}
