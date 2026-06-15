import { useState } from "react";

import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import FormField from "../../../../components/ui/FormField";
import FormErrorSummary from "../../../../components/ui/FormErrorSummary";
import useFormErrors from "../../../../hooks/useFormErrors";
import toast from "../../../../components/ui/toast";

export default function ValidationDemo() {
  const [form, setForm] = useState({ name: "", email: "" });
  const {
    errors,
    setErrors,
    clearFieldError,
    registerField,
    focusFirstError,
  } = useFormErrors();

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    clearFieldError(key);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Required";
    if (!form.email.trim()) next.email = "Required";
    else if (!/.+@.+\..+/.test(form.email)) next.email = "Enter a valid email";
    setErrors(next);
    if (Object.keys(next).length === 0) {
      toast.success("Validated! (this is a demo — nothing was submitted)");
    } else {
      focusFirstError(next);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 14 }}
      noValidate
    >
      <FormErrorSummary
        errors={errors}
        labels={{ name: "Name", email: "Email" }}
        onFocusField={(name) => focusFirstError({ [name]: errors[name] })}
      />
      <FormField
        label="Name"
        required
        name="name"
        registerField={registerField}
        error={errors.name}
      >
        <Input
          placeholder="Ada Lovelace"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          error={errors.name}
        />
      </FormField>
      <FormField
        label="Email"
        required
        name="email"
        registerField={registerField}
        error={errors.email}
      >
        <Input
          type="email"
          placeholder="ada@school.edu"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
          error={errors.email}
        />
      </FormField>
      <div style={{ display: "flex", gap: 8 }}>
        <Button type="submit">Validate</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setForm({ name: "", email: "" });
            setErrors({});
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
