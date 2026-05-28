import { useState } from "react";
import { submitForm } from "../lib/forms";

/**
 * Example contact form component.
 *
 * Replace 'YOUR_FORM_ID' with the form ID from your Popcorn CMS form builder.
 * Find it in Forms → [your form] → Integrate.
 */

const FORM_ID = "YOUR_FORM_ID";

export function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");

    const formData = new FormData(e.currentTarget);
    const fields = Object.fromEntries(formData.entries());

    const result = await submitForm(FORM_ID, fields);

    if (result.success) {
      setStatus("success");
      setMessage(result.message);
      (e.target as HTMLFormElement).reset();
    } else {
      setStatus("error");
      setMessage(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>

      {status === "success" && (
        <p className="text-green-700 text-sm bg-green-50 p-3 rounded-md">
          {message}
        </p>
      )}
      {status === "error" && (
        <p className="text-red-700 text-sm bg-red-50 p-3 rounded-md">
          {message}
        </p>
      )}
    </form>
  );
}
