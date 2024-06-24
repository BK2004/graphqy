import { PauseIcon, PlayIcon } from "./Icons";
import IconButton from "./IconButton";

interface Props {
	onPlay: () => any,
	onPause: () => any,
}
const ControlBar = ({ onPlay, onPause }: Props) => {
	return (<div className="w-full py-2 px-8 flex flex-row justify-start gap-4 bg-gray-200">
		<IconButton icon={<PlayIcon color="#0F0" className="" />} onClick={(e) => {onPlay()}} />
		<IconButton icon={<PauseIcon color="#E7E700" className="" />} onClick={(e) => {onPause()}} />
	</div>);
}
export default ControlBar;