/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useState, useEffect } from "react";
import { ResponsiveContainer } from "recharts";
import useCountryAnalytics from "@hooks/metrics/useCountryAnalytics";
import { Card } from "@components/ui";

type UsersMapProps = {
  className?: string;
};

const UsersMap = ({ className, ...restProps }: UsersMapProps) => {
  const [users, setUsers] = useState(0);
  const { data } = useCountryAnalytics();

  useEffect(() => {
    if (data.length) {
      const count = data.reduce((res, c) => res + c.visitors, 0);
      setUsers(count);
      const datObj = data.reduce(
        (res, c) => ({
          ...res,
          [c.alpha_3]: {
            ...c,
            country: c.alpha_3,
            centered: c.alpha_3,
            radius: c.percentage / 10 + 8,
            fillKey: c.percentage > 10 ? "bubbleBig" : "bubbleSmall",
          },
        }),
        {}
      );

      new window.Datamap({
        element: document.getElementById("mapContainer"),
        geographyConfig: {
          popupOnHover: true,
          highlightOnHover: true,
          highlightFillColor: "#36454F",
          highlightBorderColor: "#36454F",
          borderColor: "#69737C",
          borderWidth: 0.5,
          popupTemplate: function (geo, data) {
            return (
              '<div class="hoverinfo" style="color: #000000; border-radius: 20px; padding: 8px 16px; box-shadow: none">' +
              data.name +
              "<br/>" +
              "Visitors:" +
              data.visitors +
              "</div>"
            );
          },
        },
        data: datObj,
        fills: {
          defaultFill: "#ffffff", //the keys in this object map to the "fillKey" of [data] or [bubbles]
          bubbleDefault: "#222526",
          bubbleSmall: "#E1E1E1",
          bubbleBig: "#222526",
        },
      });
    }
  }, [data]);

  return (
    <Card className={`${className}`} {...restProps}>
      <div className="text-lg font-semibold">OGY Users Map</div>
      <ResponsiveContainer className="mt-8 p-6 xl:p-16 border border-border rounded-xl bg-gradient-to-b from-[#F4F9FB] to-[#DCE7EC]">
        <div
          id="mapContainer"
          className="relative flex justify-center items-start w-full h-[250px] xl:h-[500px]"
        ></div>
        <div className="text-center font-semibold mt-8">
          <div className="text-xl font-semibold text-background">
            Total visitors
          </div>
          <div className="text-2xl text-background/60">{users}</div>
        </div>
      </ResponsiveContainer>
    </Card>
  );
};

export default UsersMap;
