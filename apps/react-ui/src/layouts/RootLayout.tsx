import s from './RootLayout.module.scss'
import { Outlet } from 'react-router-dom';

const RootLayout: React.FC = () => {
  return <main className={s.rootLayout}><Outlet /></main>;
};

export default RootLayout;