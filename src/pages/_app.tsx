import { type AppType } from "next/app";
import { ClerkProvider } from '@clerk/nextjs'
import { api } from "~/utils/api";
import "~/styles/globals.css";
import Navbar from "~/components/layout/Navbar";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ClerkProvider>
      <Navbar />
      <Component {...pageProps} />
    </ClerkProvider>
  )
};

export default api.withTRPC(MyApp);
