import { useState, useEffect } from "react";
import useUsersCountryAnalitycs from "./useCountryAnalitycs";
import { Card } from "@components/ui";

type UsersMapProps = {
    className?: string;
};

const UsersMap = ({ className, ...restProps }: UsersMapProps) => {
    const [users, setUsers] = useState(0);
    const { data } = useUsersCountryAnalitycs();

    useEffect(() => {
        if (data.length) {
            const count = data.reduce((res, c: any) => (res + c.visitors), 0);
            setUsers(count);
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
                        highlightFillColor: '#36454F',
                        highlightBorderColor: '#36454F',
                        borderColor: '#69737C',
                        borderWidth: 0.5,
                        popupTemplate: function (geo, data) {
                            return '<div class="hoverinfo" style="color: #000000; border-radius: 20px; padding: 8px 16px; box-shadow: none">' + data.name + '<br/>' + 'Visitors:' + data.visitors + '</div>'
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
        <div id="mapContainer" style={{ position: 'relative', width: '100%', height: '600px' }} />
        <div className="text-center text-lg font-semibold text-content/60">Total visitors: </div>
        <div className="text-center font-semibold text-2xl">{users}</div>
    </Card>
}

export default UsersMap;