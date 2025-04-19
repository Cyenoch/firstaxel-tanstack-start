import { useEffect } from "react";
import { ThemeProvider } from "./theme-provider";

const Providers = ({ children }: { children: React.ReactNode }) => {
	useEffect(() => {
		if (typeof window !== "undefined") {
			return;
		}
	}, []);
	return <ThemeProvider>{children}</ThemeProvider>;
};

export default Providers;
