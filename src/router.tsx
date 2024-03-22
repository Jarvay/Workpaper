import { createHashRouter, RouteObject } from 'react-router-dom';
import Home from '@/pages/home';
import Rule from '@/pages/rule';
import Wallpaper from '@/pages/wallpaper';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/weekday/:id',
    element: <Rule />,
  },
  {
    path: '/wallpaper/:displayId',
    element: <Wallpaper />,
  },
];

export const router = createHashRouter(routes);
