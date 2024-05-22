import {
  UseFormRegister,
  FieldValues,
  FieldError,
  Path,
} from "react-hook-form";

interface InputFieldProps {
  id: Path<FieldValues>;
  type: string;
  register: UseFormRegister<FieldValues>;
  errors: FieldError;
  placeholder?: string;
}

const InputField = ({
  id,
  type,
  register,
  errors,
  placeholder = "",
}: InputFieldProps) => {
  return (
    <>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        {...register}
        className="form-input px-4 py-3 mt-2 bg-surface border border-border rounded-full w-full outline-none focus:outline-none focus:border-border focus:ring-0"
      />
      {errors && (
        <p className="text-red-500 text-sm font-semibold p-2">
          {errors?.message}
        </p>
      )}
    </>
  );
};

export default InputField;
