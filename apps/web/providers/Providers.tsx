import PrivyProviders from "./PrivyProviders";
import { StoreProvider } from "./StoreProvider";

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProviders>
      <StoreProvider>
        {children}
      </StoreProvider>
    </PrivyProviders>
  );
}