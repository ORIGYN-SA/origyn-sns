import Header from "@components/Header/Header";
import Footer from "@components/Footer/Footer";

const PageLayout = ({ children }) => (
  <>
    <Header />
    {children}
    <Footer />
  </>
);

export default PageLayout;
