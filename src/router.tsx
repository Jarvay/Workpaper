import { createHashRouter, RouteObject } from 'react-router-dom';
import Home from '@/pages/home';
import Rule from '@/pages/rule';
import StaticWallpaper from '@/pages/wallpaper/static';
import LiveWallpaper from '@/pages/wallpaper/live';
import Lib from '@/pages/lib';
import Website from '@/pages/lib/website';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/libs',
    element: <Lib />,
  },
  {
    path: '/website/:id',
    element: <Website />,
  },
  {
    path: '/weekday/:id',
    element: <Rule />,
  },
  {
    path: '/wallpaper/static/:displayId',
    element: <StaticWallpaper />,
  },
  {
    path: '/wallpaper/live/:displayId',
    element: <LiveWallpaper />,
  },
];

export const router = createHashRouter(routes);
