import { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

const PageContainer = ({ children, className = "" }: PageContainerProps) => (
  <div className={`max-w-[1287px] mx-auto pt-0 pb-16 px-6 ${className}`}>
    {children}
  </div>
);

export default PageContainer;
