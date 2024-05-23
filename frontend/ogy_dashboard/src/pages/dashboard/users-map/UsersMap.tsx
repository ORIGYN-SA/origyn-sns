import { useState, useEffect } from "react";
import useUsersCountryAnalitycs from "./useCountryAnalitycs";
import { Card } from "@components/ui";

type UsersMapProps = {
    className?: string;
};

const UsersMap = ({ className, ...restProps }: UsersMapProps) => {
    const { data } = useUsersCountryAnalitycs();

    console.log("DATA MAP", data);
    useEffect(() => {
        if (data.length) {
            console.log(data);
            const datObj = data.reduce((res, c: any) => ({
                ...res, [c.alpha_3]: {
                    ...c,
                    country: c.alpha_3,
                    centered: c.alpha_3,
                    radius: c.percentage / 10 + 8,
                    fillKey: c.percentage > 10 ? 'bubbleBig' : 'bubbleSmall',
                }
            }), {});

            //@ts-ignore
            const map1 = new window.Datamap(
                {
                    element: document.getElementById('mapContainer'),
                    geographyConfig: {
                        popupOnHover: true,
                        highlightOnHover: true,
                        borderColor: '#69737C',
                        borderWidth: 0.5,
                        popupTemplate: function (geo, data) {
                            return '<div class="hoverinfo" style="color: #000000">' + data.name + '<br/>' + 'Visitors:' + data.visitors + '</div>'
                        },
                    },
                    data: datObj,
                    fills: {
                        defaultFill: '#FFFFFF', //the keys in this object map to the "fillKey" of [data] or [bubbles]
                        bubbleDefault: '#222526',
                        bubbleSmall: '#E1E1E1',
                        bubbleBig: '#222526',
                    }
                });
        }

    }, [data])

    return <Card className={`${className}`} {...restProps}>
        <div id="mapContainer" style={{ position: 'relative', width: '100%', height: '600px' }}></div>
    </Card>
}

export default UsersMap;