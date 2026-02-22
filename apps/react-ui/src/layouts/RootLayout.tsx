// import NavBarOne from '@/shared-components/NavBarOne'
import NavBarTwo from '@/shared-components/NavBarTwo'
import { Outlet } from 'react-router-dom';

const RootLayout: React.FC = () => {
  return (
    <>
      <NavBarTwo />
      <main className="container mx-auto px-4">
        <Outlet />
      </main>
    </>
  )
};

export default RootLayout;