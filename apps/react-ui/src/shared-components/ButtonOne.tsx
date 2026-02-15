import { clsx } from "clsx";

type ButtonProps = {
  children: React.ReactNode,
  className?: string,
  onClick?: () => void,
  isActive?: boolean
}

const ButtonOne: React.FC<ButtonProps> = ({ children, className, onClick, isActive }) => (
<button
  className={clsx(
    "cursor-pointer px-2 py-1 rounded border text-sm bg-gray-900 text-white border-gray-900",
    "disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed",
    !isActive && "bg-gray-200! text-gray-900! border-gray-200!",
    className
  )}
  onClick={onClick}
>
  {children}
</button>
);


export default ButtonOne;