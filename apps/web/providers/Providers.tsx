import PrivyProviders from "./PrivyProviders";

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProviders>
      {children}
    </PrivyProviders>
  );
}