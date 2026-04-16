import { ChangeEvent, useState, KeyboardEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import _debounce from "lodash/debounce";
import { SearchIcon, CloseIcon } from "@components/ui/icons";

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
              <SearchIcon />
            </div>
          ) : (
            <button
              onClick={handleResetSearch}
              className="mr-2 p-1"
            >
              <CloseIcon />
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
