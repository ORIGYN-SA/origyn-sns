import { getActor } from "@amerej/artemis-react";
import { formatChartDate } from "@helpers/dates";
import { TimeStats } from "@hooks/super_stats_v3/declarations";
import { ChartData } from "@services/types/charts.types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

// Fonction pour transformer les données des transactions en données pour un graphique
const formatChartData = (data: TimeStats, period: string): ChartData[] => {
  const chartData: ChartData[] = [];

  if (period === "daily") {
    data.count_over_time.forEach((chunk) => {
      // Convertir chunk.start_time (bigint) en millisecondes
      const date = new Date(Number(chunk.start_time / 1_000_000n)); // Conversion en millisecondes
      const formattedDate = formatChartDate(date, "daily"); // "Sept 09"

      chartData.push({
        name: formattedDate,
        value: Number(chunk.transfer_count), // Utilisation de transfer_count
        valueToString: `${Number(chunk.transfer_count)} transactions`,
      });
    });

    // Trier les données du plus vieux au plus récent
    chartData.sort((a, b) => {
      const dateA = new Date(a.name);
      const dateB = new Date(b.name);
      return dateA.getTime() - dateB.getTime(); // Tri ascendant (du plus ancien au plus récent)
    });
  }

  if (period === "monthly") {
    const monthlyData = new Map<string, number>();

    data.count_over_time.forEach((chunk) => {
      // Convertir chunk.start_time (bigint) en millisecondes
      const date = new Date(Number(chunk.start_time / 1_000_000n)); // Conversion en millisecondes
      const formattedMonth = formatChartDate(date, "monthly"); // "September"

      if (!monthlyData.has(formattedMonth)) {
        monthlyData.set(formattedMonth, 0);
      }
      monthlyData.set(
        formattedMonth,
        monthlyData.get(formattedMonth)! + Number(chunk.transfer_count)
      );
    });

    // Transformer la Map en tableau et trier les mois du plus loin au plus proche
    const sortedMonthlyData = Array.from(monthlyData.entries()).sort((a, b) => {
      const dateA = new Date(`01 ${a[0]}`).getTime();
      const dateB = new Date(`01 ${b[0]}`).getTime();
      return dateA - dateB;
    });

    // Pousser les données triées dans le tableau chartData
    sortedMonthlyData.forEach(([key, value]) => {
      chartData.push({
        name: key,
        value,
        valueToString: `${value} transactions`,
      });
    });
  }

  return chartData;
};

// Hook pour récupérer les données et formater pour le chart
const useFetchCountTransactions = (period: string) => {
  const { data, isSuccess, isError, isLoading } = useQuery({
    queryKey: ["fetchCountTransactions", period],
    queryFn: async (): Promise<TimeStats> => {
      const actor = await getActor("tokenStats", { isAnon: true });
      const results = await actor.get_daily_stats();
      return results as TimeStats;
    },
  });

  console.log("data", data, period);

  // Utilisation de useMemo pour éviter de recalculer les données formatées à chaque rendu
  const chartData = useMemo(() => {
    if (isSuccess && data) {
      return formatChartData(data, period);
    }
    return [];
  }, [data, isSuccess, period]);

  return {
    data: chartData,
    isSuccess,
    isError,
    isLoading,
  };
};

export default useFetchCountTransactions;
