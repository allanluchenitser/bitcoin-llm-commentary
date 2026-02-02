import NavBar from '@/shared-components/NavBar'
import { Outlet } from 'react-router-dom';

const RootLayout: React.FC = () => {
  return (
    <>
      <NavBar />
      <main className="container mx-auto px-4">
        <Outlet />
      </main>
    </>
  )
};

export default RootLayout;