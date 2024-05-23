import {
    UseQueryOptions,
    FetchQueryOptions,
    keepPreviousData,
} from "@tanstack/react-query";
import analitycsAPI from "@services/api/analitycs";
import { ChartData } from "@services/types/charts.types";
import { PLAUSIBLE_API_KEY } from "@constants/index";

export interface UsersCountryAnalyticsParams {
    options?: UseQueryOptions;
    start?: string | null; // in timestamp
    end?: string | null; // in timestamp
    step?: string | null; // in seconds
}

export interface UserByCountry {
    alpha_3: string;
    code: string;
    flag: string;
    name: string;
    percentage: number;
    visitors: number;
}

const fn = async (): Promise<UserByCountry[]> => {
    const { data } = await analitycsAPI.get(
        `/dashboard.origyn.ch/countries?period=30d&date=2024-05-23&filters=%7B%7D&with_imported=true&auth=${PLAUSIBLE_API_KEY}&limit=300`
    );
    return data;
};

const fetchUsersCountryAnalyticsQuery = ({
    options,
    start = null,
    end = null,
    step = null,
}: UsersCountryAnalyticsParams) => {
    return {
        queryKey: ["fetchUsersCountryAnalitycs", start, end, step],
        queryFn: async () => fn(),
        placeholderData: keepPreviousData,
        ...options,
    } as FetchQueryOptions;
};

export default fetchUsersCountryAnalyticsQuery;
