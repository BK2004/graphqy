import { MouseEventHandler, type ReactNode } from "react"

interface Props {
	icon: ReactNode,
	onClick: MouseEventHandler<HTMLButtonElement>,
	className?: string
}

const IconButton = ({ icon, onClick, className }: Props) => {
	return <button className={`h-fit w-fit ${className ?? ""}`} onClick={onClick}>
		{icon}
	</button>
}
export default IconButton;