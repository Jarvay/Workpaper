import { createHashRouter, RouteObject } from 'react-router-dom';
import Home from '@/pages/home';
import Rule from '@/pages/rule';
import LiveWallpaper from '@/pages/wallpaper/live';
import MarqueeWallpaper from '@/pages/wallpaper/marquee';
import Lib from '@/pages/lib';
import AlbumIndex from '@/pages/album';
import MarqueeIndex from '@/pages/marquee';
import WebpageIndex from '@/pages/webpage';
import { VerticalStaticWallpaper } from '@/pages/wallpaper/static/vertical.tsx';
import { HorizontalStaticWallpaper } from '@/pages/wallpaper/static/horizontal.tsx';

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
    path: '/weekday/:id',
    element: <Rule />,
  },
  {
    path: '/wallpaper/static-vert/:windowId',
    element: <VerticalStaticWallpaper />,
  },
  {
    path: '/wallpaper/static-hori/:windowId',
    element: <HorizontalStaticWallpaper />,
  },
  {
    path: '/wallpaper/live/:windowId',
    element: <LiveWallpaper />,
  },
  {
    path: '/wallpaper/marquee/:windowId',
    element: <MarqueeWallpaper />,
  },
];

export const router = createHashRouter(routes);
