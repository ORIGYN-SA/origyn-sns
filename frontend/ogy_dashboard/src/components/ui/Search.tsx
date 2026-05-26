import {
  ChangeEvent,
  useState,
  KeyboardEvent,
  useCallback,
  useRef,
} from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { SearchIcon, CloseIcon } from "@components/ui/icons";

interface ISearch {
  className?: string;
  id?: string;
  placeholder?: string;
  dropdown?: React.ReactNode;
  actions?: React.ReactNode;
  onEnter?: () => void;
}

const Search = ({
  className,
  id = "search",
  placeholder = "Search for an items...",
  dropdown,
  actions,
  onEnter,
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

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSetSearchParams = useCallback(
    (value: string) => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        if (value !== "") {
          searchParams.set("searchterm", value);
          setSearchParams(searchParams);
        }
      }, 800);
    },
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

  const handleOnKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;

    e.preventDefault();
    onEnter?.();
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
          onKeyDown={handleOnKeyDown}
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
          <div className="flex items-center gap-1">
            {actions}
            {searchterm === "" ? (
              <div className="mr-2 p-1">
                <SearchIcon />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleResetSearch}
                className="mr-2 p-1"
              >
                <CloseIcon />
              </button>
            )}
          </div>
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
