import { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

const PageContainer = ({ children, className = "" }: PageContainerProps) => (
  <div className={`max-w-[1287px] mx-auto pb-16 px-6 ${className}`}>
    {children}
  </div>
);

export default PageContainer;
