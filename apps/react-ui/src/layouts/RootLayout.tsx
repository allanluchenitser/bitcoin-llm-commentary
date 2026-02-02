import { Outlet } from 'react-router-dom';
import NavBar from '@/shared-components/NavBar'

import s from './RootLayout.module.scss'
const RootLayout: React.FC = () => {
  return (
    <>
      <NavBar />
      <main className={s.rootLayout}><Outlet /></main>
    </>
  )
};

export default RootLayout;