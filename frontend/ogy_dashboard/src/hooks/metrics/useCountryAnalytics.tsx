import { useState, useEffect } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import fetchUsersCountryAnalitycs, { UserByCountry }  from "@services/queries/metrics/fetchUsersCountryAnalitycs";

const useUsersCountryAnalitycs = () => {
  const [data, setData] = useState<UserByCountry[]>([]);

  const {
    data: fetchedData,
    isSuccess,
    isLoading,
    error,
  }: UseQueryResult<UserByCountry[]> = useQuery(fetchUsersCountryAnalitycs({}));

  useEffect(() => {
    if (isSuccess) {
      setData(fetchedData);
    }
  }, [
    isSuccess,
    fetchedData,
  ]);

  return { data, isSuccess, isLoading, error };
};

export default useUsersCountryAnalitycs;
