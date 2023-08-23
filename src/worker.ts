export interface Env {
	DISCORD_
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// return new Response('Hello World!');
		let url = new URL(request.url);
		if (url.pathname === "/") {
			// redirect to discord
			return Response.redirect(env.)
		}
	},
};
