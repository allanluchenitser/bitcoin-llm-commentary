import { NavLink } from 'react-router-dom';

const NavBar: React.FC = () => (
  <nav className="container mx-auto px-4">
    <div className="flex justify-center gap-5">
      <NavLink to="/" className={({ isActive }) => isActive ? 'underline' : ''}>
        Dashboard
      </NavLink>
      <NavLink to="/about" className={({ isActive }) => isActive ? 'underline' : ''}>
        About
      </NavLink>
      <NavLink to="/sandbox" className={({ isActive }) => isActive ? 'underline' : ''}>
        Sandbox
      </NavLink>
    </div>
  </nav>
)

export default NavBar;