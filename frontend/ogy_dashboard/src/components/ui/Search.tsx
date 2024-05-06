import { ChangeEvent, useState, KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";

interface ISearch {
  className?: string;
  id?: string;
  placeholder?: string;
}

const Search = ({
  className,
  id = "search",
  placeholder = "Search for an items...",
  ...restProps
}: ISearch) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { register, reset } = useForm({
    mode: "onChange",
    shouldUnregister: true,
  });

  const [searchterm, setSearchterm] = useState(
    searchParams.get("searchterm") || ""
  );

  const handleResetSearch = () => {
    setSearchterm("");
    searchParams.delete("searchterm");
    setSearchParams(searchParams);
    reset();
  };

  const handleOnChange = (e: ChangeEvent) => {
    const value = (e?.target as HTMLTextAreaElement)?.value;
    if (value === "") {
      handleResetSearch();
    } else {
      setSearchterm(value);
      searchParams.set("searchterm", value);
      setSearchParams(searchParams);
    }
  };

  const handleOnKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.key === "Enter" && e.preventDefault();
  };

  return (
    <div className={`${className}`} {...restProps}>
      <form
        onKeyDown={handleOnKeyDown as () => void}
        className="rounded-full bg-surface border border-border px-4 py-2 flex justify-between items-center w-full"
      >
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          {...(register(id),
          {
            onChange: (e) => handleOnChange(e),
            value: searchterm,
          })}
          className="form-input bg-surface w-full outline-none focus:outline-none focus:border-none border-0 focus:ring-0"
        />
        {searchterm === "" ? (
          <div
            onClick={handleResetSearch}
            className="rounded-full bg-surface mr-2 p-1"
          >
            <MagnifyingGlassIcon className="h-7 w-7" aria-hidden="true" />
          </div>
        ) : (
          <button
            onClick={handleResetSearch}
            className="rounded-full bg-surface-2 mr-2 p-1"
          >
            <XMarkIcon className="h-7 w-7" aria-hidden="true" />
          </button>
        )}
      </form>
    </div>
  );
};

export default Search;
