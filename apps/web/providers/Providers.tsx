import PrivyProviders from "./PrivyProviders";
import { StoreProvider } from "./StoreProvider";
import { UIProvider } from "./UIProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProviders>
      <UIProvider>

        <StoreProvider>
          {children}
        </StoreProvider>
      </UIProvider>
    </PrivyProviders>
  );
}