import { cva, VariantProps } from "cva";
import { forwardRef, ReactNode, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

const textVariants = cva("", {
  defaultVariants: {
    size: "default",
  },
  variants: {
    size: {
      default: "text-inherit",
      lg: "text-lg",
      sm: "text-base",
      xs: "text-base",
    },
  },
});

interface TextProps extends VariantProps<typeof textVariants> {
  asParagraph?: boolean;
  children: ReactNode;
  className?: string;
  muted?: boolean;
}

function Text(props: TextProps) {
  const { asParagraph, children, className, muted, size } = props;

  const styles = twMerge(
    "break-words",
    textVariants({ size }),
    muted && "text-muted-foreground",
    className
  );

  if (asParagraph) return <p className={styles}>{children}</p>;

  return <span className={styles}>{children}</span>;
}

interface MarqueeTextProps {
  text: string;
  speed?: number;
  className?: string;
}

const MarqueeText = forwardRef<HTMLDivElement, MarqueeTextProps>(
  ({ text, speed = 6, className = "" }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
      if (containerRef.current && contentRef.current) {
        const isOverflowing =
          contentRef.current.scrollWidth > containerRef.current.clientWidth;
        setShouldAnimate(isOverflowing);
      }
    }, [text]);

    return (
      <div
        ref={ref || containerRef}
        className={`w-full overflow-hidden ${className}`}
      >
        <div
          ref={contentRef}
          className={`inline-flex whitespace-nowrap ${
            shouldAnimate ? "animate-marquee" : ""
          }`}
          style={{
            animationDuration: `${speed}s`,
          }}
        >
          <span className={shouldAnimate ? "px-6" : ""}>{text}</span>
          {shouldAnimate && <span className="px-6">{text}</span>}
        </div>

        <style jsx>{`
          @keyframes marquee {
            0% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          .animate-marquee {
            animation-name: marquee;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
        `}</style>
      </div>
    );
  }
);

MarqueeText.displayName = "MarqueeText";

export { MarqueeText, Text };
