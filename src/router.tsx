import { createHashRouter, RouteObject } from 'react-router-dom';
import Home from '@/pages/home';
import Rule from '@/pages/rule';
import StaticWallpaper from '@/pages/wallpaper/static';
import LiveWallpaper from '@/pages/wallpaper/live';
import MarqueeWallpaper from '@/pages/wallpaper/marquee';
import Lib from '@/pages/lib';
import Website from '@/pages/lib/website';
import AlbumIndex from '@/pages/album';
import MarqueeIndex from '@/pages/marquee';
import WebpageIndex from '@/pages/webpage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/library',
    element: <Lib />,
  },
  {
    path: '/albums',
    element: <AlbumIndex />,
  },
  {
    path: '/marquees',
    element: <MarqueeIndex />,
  },
  {
    path: '/webpages',
    element: <WebpageIndex />,
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
  {
    path: '/wallpaper/marquee/:displayId',
    element: <MarqueeWallpaper />,
  },
];

export const router = createHashRouter(routes);
