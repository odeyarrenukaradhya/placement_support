import * as React from "react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Button
export const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
    outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
    ghost: "hover:bg-slate-100 text-slate-600",
    link: "text-blue-600 underline-offset-4 hover:underline",
  }
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  }
  
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl text-sm font-semibold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
})
Button.displayName = "Button"

// Card
export const Card = ({ className, ...props }) => (
  <div className={cn("rounded-3xl border border-slate-200 bg-white text-slate-950 shadow-sm", className)} {...props} />
)
export const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
)
export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("text-2xl font-bold leading-none tracking-tight text-slate-900", className)} {...props} />
)
export const CardDescription = ({ className, ...props }) => (
  <p className={cn("text-sm text-slate-500 font-medium", className)} {...props} />
)
export const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
)
export const CardFooter = ({ className, ...props }) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
)

// Simplified Select with state management
export const Select = ({ children, value, onValueChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            value, 
            onValueChange, 
            isOpen, 
            setIsOpen 
          });
        }
        return child;
      })}
    </div>
  )
}

export const SelectTrigger = ({ className, children, value, placeholder, isOpen, setIsOpen }) => (
  <div 
    onClick={() => setIsOpen(!isOpen)}
    className={cn(
      "flex h-12 w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 transition-all",
      isOpen && "ring-2 ring-blue-500 border-transparent",
      className
    )}
  >
    <span className={!value ? "text-slate-400" : ""}>{value || placeholder}</span>
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn("lucide lucide-chevron-down ml-2 h-4 w-4 opacity-50 transition-transform duration-200", isOpen && "rotate-180")}
    >
      <path d="m6 9 6 6 6-6"/>
    </svg>
  </div>
)

export const SelectValue = ({ placeholder, value }) => <span>{value || placeholder}</span>

export const SelectContent = ({ children, value, onValueChange, isOpen, setIsOpen }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-slate-100 bg-white p-2 text-slate-950 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            isSelected: child.props.value === value,
            onClick: () => {
              onValueChange && onValueChange(child.props.value);
              setIsOpen(false);
            }
          });
        }
        return child;
      })}
    </div>
  )
}

export const SelectItem = ({ children, value, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none hover:bg-slate-50 transition-colors",
      isSelected && "bg-blue-50 text-blue-700 font-bold"
    )}
  >
    {isSelected && (
      <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M20 6 9 17l-5-5"/></svg>
      </span>
    )}
    {children}
  </div>
)
