import { auth } from "@/auth";
import { LandingPage } from "@/components/landing-page";

export default async function Home() {
  const session = await auth();
  const isSignedIn = Boolean(session?.user?.id);

  return <LandingPage isSignedIn={isSignedIn} />;
}
