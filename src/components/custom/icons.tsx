import { LucideIcon, ArrowUp, StopCircle, Paperclip } from "lucide-react";

interface IconProps {
  size?: number;
  className?: string;
}

export const ArrowUpIcon = ({ size = 24, className }: IconProps) => (
  <ArrowUp size={size} className={className} />
);

export const StopIcon = ({ size = 24, className }: IconProps) => (
  <StopCircle size={size} className={className} />
);

export const PaperclipIcon = ({ size = 24, className }: IconProps) => (
  <Paperclip size={size} className={className} />
); 