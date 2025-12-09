const ciDomain = "ci.cherev";
const originPath = "https://lifeabundantly.github.io/Table_Well";

async function handleRequest(request) {
    const url = new URL(request.url);

    // Rewrite address bar to CI.CHEREV mirror
    const displayed = new URL(originPath + url.pathname + url.search);

    // Fetch real content from GitHub Pages origin
    const response = await fetch(displayed.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
    });

    // Return response but mask origin headers
    const newHeaders = new Headers(response.headers);

    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.delete("x-github-request-id");
    newHeaders.delete("via");

    return new Response(await response.body, {
        status: response.status,
        headers: newHeaders
    });
}

addEventListener("fetch", event => {
    event.respondWith(handleRequest(event.request));
});
