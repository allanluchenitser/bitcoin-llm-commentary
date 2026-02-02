import s from './NavBar.module.scss'
import { NavLink } from 'react-router-dom';

const NavBar: React.FC = () => (
  <nav className={s.navBar}>
    <NavLink to="/">Dashboard</NavLink>
    <NavLink to="/about">About</NavLink>
  </nav>
)

export default NavBar;