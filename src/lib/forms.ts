/**
 * Form submission utility for Popcorn CMS forms.
 */

const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export interface FormSubmitResult {
    success: boolean;
    message: string;
    submissionId?: string;
}

/**
 * Submit a form to Popcorn CMS.
 *
 * @param formId - The form ID from your Popcorn CMS form builder
 * @param fields - Key-value pairs of field data
 * @returns Result with success status and message
 *
 * @example
 * ```ts
 * const result = await submitForm('clx123abc', {
 *   email: 'visitor@example.com',
 *   name: 'Jane Smith',
 *   message: 'Hello!'
 * });
 * ```
 */
export async function submitForm(
    formId: string,
    fields: Record<string, unknown>,
): Promise<FormSubmitResult> {
    const response = await fetch(`${API_URL}/forms/${formId}/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
        },
        body: JSON.stringify({ fields }),
    });

    const json = await response.json();

    if (!response.ok) {
        return {
            success: false,
            message: json.message || 'Something went wrong. Please try again.',
        };
    }

    return {
        success: true,
        message: json.message || 'Form submitted successfully!',
        submissionId: json.submissionId,
    };
}
