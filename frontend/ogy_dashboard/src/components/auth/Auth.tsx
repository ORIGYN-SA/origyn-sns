import { ConnectButton, ConnectDialog } from "@connect2ic/react";
import styled from "styled-components";
import useThemeDetector from "@helpers/theme/useThemeDetector";

const Styles = styled.div`
  .connect-button {
    font-size: 16px;
    font-weight: 600;
    background: rgb(var(--color-charcoal));
    @media (prefers-color-scheme: dark) {
      background: #fff;
      color: rgb(var(--color-charcoal));
    }
  }

  .dialog-styles {
    backdrop-filter: blur(0px);
  }
`;

const Auth = () => {
  const isDarkTheme = useThemeDetector();

  //   const { isConnected, principal, activeProvider } = useConnect({
  //     onConnect: () => {
  //       console.log("Connected");
  //     },
  //     onDisconnect: () => {
  //       console.log("Disconected");
  //     },
  //   });

  return (
    <Styles>
      <ConnectButton />
      <ConnectDialog dark={isDarkTheme ? true : false} />
    </Styles>
  );
};

export default Auth;
