import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "@tanstack/react-start/config";
import tsConfigPaths from "vite-tsconfig-paths";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";


export default defineConfig({
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
    ],
    optimizeDeps:{
      esbuildOptions:{
        plugins:[
          // @ts-expect-error - esbuild-plugin-node-globals-polyfill is not a valid esbuild plugin
          NodeGlobalsPolyfillPlugin({
            buffer: true,
          }),
        ],
      },

    },

    define:{
      global: "window",
  },

},


  // https://react.dev/learn/react-compiler
  react: {
    babel: {
      plugins: [
        [
          "babel-plugin-react-compiler",
          {
            target: "19",
          },
        ],
      ],
    },
  },

  tsr: {
    // https://github.com/TanStack/router/discussions/2863#discussioncomment-12458714
    appDirectory: "./src",
  },

  server: {
    // https://tanstack.com/start/latest/docs/framework/react/hosting#deployment
    // preset: "netlify",
  },
});
