import PrivyProviders from "./PrivyProviders";
import { StoreProvider } from "./StoreProvider";
import { UIProvider } from "./UIProvider";
import { WebSocketProvider } from "./WebSocketProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProviders>
      <StoreProvider>
        <WebSocketProvider>
          <UIProvider>
            {children}
          </UIProvider>
        </WebSocketProvider>
      </StoreProvider>
    </PrivyProviders>
  );
}