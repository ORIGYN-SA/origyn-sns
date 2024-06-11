import { Navigate, RouteObject } from 'react-router-dom';
import BrandMaterial from '@/pages/brandMaterial';
import Foundation from '@/pages/foundation';
import Home from '@/pages/home';
import NewsRoom from '@/pages/newsRoom';
import Products from '@/pages/products';
import RoadMap from '@/pages/roadMap';
import Technology from '@/pages/technology';

const routes: RouteObject[] = [
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/technology/:type',
        element: <Technology />,
    },
    {
        path: '/products/:type',
        element: <Products />,
    },
    {
        path: '/roadmap',
        element: <RoadMap />,
    },
    {
        path: '/brandMaterial',
        element: <BrandMaterial />,
    },
    {
        path: '/newsroom',
        element: <NewsRoom />,
    },
    {
        path: '/foundation',
        element: <Foundation />,
    },
    {
        path: '/*',
        element: <Navigate to="/" />,
    },
];

export default routes;
