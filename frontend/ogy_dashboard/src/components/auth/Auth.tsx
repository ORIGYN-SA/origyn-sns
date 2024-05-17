import { useConnect, ConnectButton, ConnectDialog } from "@connect2ic/react";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  useConnect({
    onConnect: () => {
      document.body.style.overflow = "unset";
    },
    onDisconnect: () => {
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
      console.log("disconnected");
    },
  });

  return (
    <Styles>
      <ConnectButton />
      <ConnectDialog dark={isDarkTheme} />
    </Styles>
  );
};

export default Auth;
