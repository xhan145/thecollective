declare module "lucide-react" {
  import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";

  export type LucideProps = SVGProps<SVGSVGElement> & {
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  };

  export type LucideIcon = ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;

  export const ArrowRight: LucideIcon;
  export const BadgeCheck: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Bell: LucideIcon;
  export const BookOpen: LucideIcon;
  export const Bookmark: LucideIcon;
  export const Camera: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const CircleAlert: LucideIcon;
  export const Clock: LucideIcon;
  export const Compass: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const FileAudio: LucideIcon;
  export const FileText: LucideIcon;
  export const Flame: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const Home: LucideIcon;
  export const Image: LucideIcon;
  export const Link: LucideIcon;
  export const ListChecks: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Monitor: LucideIcon;
  export const Moon: LucideIcon;
  export const Sun: LucideIcon;
  export const ThumbsUp: LucideIcon;
  export const UserPlus: LucideIcon;
  export const PenLine: LucideIcon;
  export const Play: LucideIcon;
  export const PlaySquare: LucideIcon;
  export const Plus: LucideIcon;
  export const Send: LucideIcon;
  export const Share: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Smartphone: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Upload: LucideIcon;
  export const UploadCloud: LucideIcon;
  export const User: LucideIcon;
  export const UserRound: LucideIcon;
  export const Video: LucideIcon;
  export const X: LucideIcon;
  export const Zap: LucideIcon;
}
