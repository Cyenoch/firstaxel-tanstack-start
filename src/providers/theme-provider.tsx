import { setThemeSeverFn } from "@/actions/theme";
import { useRouter } from "@tanstack/react-router";
import { createContext, use, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	theme?: Theme;
};

type ThemeProviderState = {
	theme: Theme | undefined;
	setTheme: (val: Theme) => void;
};

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
	children,
	defaultTheme = "system",
	theme,
	...props
}: ThemeProviderProps) {
	const router = useRouter();

	const [_theme, _setTheme] = useState<Theme>(theme || defaultTheme);

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove("light", "dark");

		if (theme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
				.matches
				? "dark"
				: "light";

			root.classList.add(systemTheme);
			return;
		}

		root.classList.add(_theme);
	}, [_theme, theme]);

	const value = {
		theme,

		setTheme(val: Theme) {
			setThemeSeverFn({ data: val });
			_setTheme(val);
			router.invalidate();
		},
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export function useTheme() {
	const val = use(ThemeProviderContext);
	if (!val) throw new Error("useTheme called outside!");
	return val;
}
