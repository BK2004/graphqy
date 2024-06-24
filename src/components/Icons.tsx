interface IconProps {
	color?: string,
	className?: string,
}

export const PlayIcon = ({ color, className }: IconProps) => {
	return (<svg className={className ?? ""}
		width="30" 
		height="30" 
		viewBox="0 0 30 30" 
		fill="none" 
		xmlns="http://www.w3.org/2000/svg">
		<path 
			d="M10 10.0014V20.3614C10 21.1514 10.87 21.6314 11.54 21.2014L19.68 16.0214C20.3 15.6314 20.3 14.7314 19.68 14.3314L11.54 9.1614C10.87 8.7314 10 9.2114 10 10.0014Z" 
			fill={color || "#FFF"} />
	</svg>);
}

export const PauseIcon = ({ color, className }: IconProps) => {
	return (<svg className={className ?? ""}
		width="30" 
		height="30" 
		viewBox="0 0 30 30" 
		fill="none" 
		xmlns="http://www.w3.org/2000/svg">
		<path 
			d="M11 22C12.1 22 13 21.1 13 20V10C13 8.9 12.1 8 11 8C9.9 8 9 8.9 9 10V20C9 21.1 9.9 22 11 22ZM17 10V20C17 21.1 17.9 22 19 22C20.1 22 21 21.1 21 20V10C21 8.9 20.1 8 19 8C17.9 8 17 8.9 17 10Z" 
			fill={color || "#FFF"} />
	</svg>);
}