'use client'
import Onboarding from "../components/onboarding/Onboarding";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Focus from "../components/modules/focus";
import Tasks from "../components/modules/tasks";
import Console from "../components/modules/console";
import Dashboard from "../components/modules/dashboard";

const LINKS = [
  {
    title: "Docs",
    href: "https://turborepo.com/docs",
    description: "Find in-depth information about Turborepo features and API.",
  },
  {
    title: "Learn",
    href: "https://turborepo.com/docs/handbook",
    description: "Learn more about monorepos with our handbook.",
  },
  {
    title: "Templates",
    href: "https://turborepo.com/docs/getting-started/from-example",
    description: "Choose from over 15 examples and deploy with a single click.",
  },
  {
    title: "Deploy",
    href: "https://vercel.com/new",
    description:
      "Instantly deploy your Turborepo to a shareable URL with Vercel.",
  },
];

export default function Page() {

  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/profile');
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <div className="page">
      <Console /> 
      {/* <Dashboard /> */}
    </div>

  );
}
