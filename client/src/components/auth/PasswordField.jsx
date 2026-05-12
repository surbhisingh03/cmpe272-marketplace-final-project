import { useId, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

export const AUTH_TEXT_INPUT_CLASS =
  "h-[44px] w-full rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white px-[14px] text-[14px] text-[#111827] outline-none transition placeholder:text-slate-400 focus:border-[#7c3aed] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]";

const inputClass =
  "h-[44px] w-full rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-white pl-[14px] pr-11 text-[14px] text-[#111827] outline-none transition placeholder:text-slate-400 focus:border-[#7c3aed] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]";

export default function PasswordField({
  id,
  name,
  value,
  onChange,
  autoComplete,
  placeholder,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}) {
  const [show, setShow] = useState(false);
  const genId = useId();
  const inputId = id || `pw-${genId}`;

  return (
    <div className="relative w-full">
      <input
        id={inputId}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={inputClass}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <FiEyeOff className="h-[18px] w-[18px]" aria-hidden /> : <FiEye className="h-[18px] w-[18px]" aria-hidden />}
      </button>
    </div>
  );
}
