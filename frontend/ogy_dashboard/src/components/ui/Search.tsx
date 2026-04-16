import { ChangeEvent, useState, KeyboardEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import _debounce from "lodash/debounce";

interface ISearch {
  className?: string;
  id?: string;
  placeholder?: string;
  dropdown?: React.ReactNode;
}

const Search = ({
  className,
  id = "search",
  placeholder = "Search for an items...",
  dropdown,
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearchParams = useCallback(
    _debounce((value) => {
      if (value !== "") {
        searchParams.set("searchterm", value);
        setSearchParams(searchParams);
      }
    }, 800),
    [searchParams, setSearchParams]
  );

  const handleOnChange = (e: ChangeEvent) => {
    const value = (e?.target as HTMLTextAreaElement)?.value;
    if (value === "") {
      handleResetSearch();
    } else {
      setSearchterm(value);
    }
    debouncedSetSearchParams(value);
  };

  const handleOnKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.key === "Enter" && e.preventDefault();
  };

  const hasDropdown = dropdown && searchterm !== "";

  return (
    <div className={`relative ${className}`} {...restProps}>
      <div
        className={`bg-surface border border-border overflow-hidden ${
          hasDropdown ? "rounded-3xl" : "rounded-full"
        }`}
      >
        <form
          onKeyDown={handleOnKeyDown as () => void}
          className="px-4 py-2 flex justify-between items-center w-full"
        >
          <input
            id={id}
            type="text"
            placeholder={placeholder}
            autoComplete="off"
            {...(register(id),
            {
              onChange: (e) => handleOnChange(e),
              value: searchterm,
            })}
            className="form-input bg-surface w-full outline-none focus:outline-none focus:border-none border-0 focus:ring-0"
          />
          {searchterm === "" ? (
            <div className="mr-2 p-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.66665 14.0007C11.1644 14.0007 14 11.1651 14 7.66732C14 4.16951 11.1644 1.33398 7.66665 1.33398C4.16884 1.33398 1.33331 4.16951 1.33331 7.66732C1.33331 11.1651 4.16884 14.0007 7.66665 14.0007Z" stroke="#222526" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.6666 14.6673L13.3333 13.334" stroke="#292D32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ) : (
            <button
              onClick={handleResetSearch}
              className="mr-2 p-1"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4L12 12M12 4L4 12" stroke="#222526" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </form>
        {hasDropdown && (
          <div className="border-t border-border px-4 pt-2 pb-3">
            {dropdown}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
