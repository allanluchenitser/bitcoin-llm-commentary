import { clsx } from "clsx";

type ButtonProps = {
  children: React.ReactNode,
  className?: string,
  onClick?: () => void,
  isActive?: boolean,
  variant?: "toggle" | "clear"
}

const twBasic = "cursor-pointer px-2 py-1 rounded border text-sm min-w-[100px] text-center";
const twDisabled = "disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed";

const ButtonOne: React.FC<ButtonProps> = ({ children, className, onClick, isActive, variant = "toggle" }) => {
let twColors, twActive;

if (variant === "toggle") {
  twColors = "bg-gray-900 text-white border-gray-900"
  twActive = "bg-white! text-gray-500! border-gray-200!"
}

if (variant === "clear") {
  isActive = false;
  twColors = "bg-transparent text-gray-900 border-gray-900"
}

return (
<button
  className={clsx(
    twBasic,
    twDisabled,
    twColors,
    !isActive && twActive,
    className
  )}
  onClick={onClick}
>
  {children}
</button>
)};


export default ButtonOne;