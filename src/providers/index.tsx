import { useEffect } from "react";

const Providers = ({ children }: { children: React.ReactNode }) => {
	useEffect(() => {
		if (typeof window !== "undefined") {
			return;
		}
	}, []);
	return <>{children}</>;
};

export default Providers;
