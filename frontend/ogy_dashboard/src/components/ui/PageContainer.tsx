import { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

const PageContainer = ({ children, className = "" }: PageContainerProps) => (
  <div className={`max-w-page mx-auto pb-16 px-6 ${className}`}>{children}</div>
);

export default PageContainer;
