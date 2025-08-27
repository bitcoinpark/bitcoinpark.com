export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const host = url.hostname.toLowerCase();
  
      const isImagineIf =
        host === "imagineifnashville.com" || host === "www.imagineifnashville.com";
  
      if (isImagineIf) {
        // If the request is not already pointing at /imagineif, rewrite it.
        if (!url.pathname.startsWith("/imagineif/")) {
          // Map "/" to your actual HTML file, and map any other path to the subdir.
          url.pathname =
            url.pathname === "/"
              ? "/imagineif/index_imagineif.html"
              : `/imagineif${url.pathname}`;
        }
        // Serve the rewritten path from your Pages static assets
        return env.ASSETS.fetch(new Request(url, request));
      }
  
      // Default behavior for bitcoinpark.com and everything else
      return env.ASSETS.fetch(request);
    },
  };
  