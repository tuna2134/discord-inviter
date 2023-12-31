export interface Env {
	DISCORD_CLIENT_ID: string;
	DISCORD_CLIENT_SECRET: string;
	DISCORD_GUILD_ID: string;
	DISCORD_TOKEN: string;
}

interface AccessTokenResponse {
	access_token: string;
}

interface User {
	id: string;
}

function createOauthUrl(clientId: string, redirectUri: string): string {
	let url = new URL('https://discord.com/oauth2/authorize');
	url.searchParams.set('client_id', clientId);
	url.searchParams.set('redirect_uri', redirectUri);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('scope', 'identify guilds.join');
	return url.toString();
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// return new Response('Hello World!');
		let url = new URL(request.url);
		if (url.pathname === '/') {
			// redirect to discord
			return Response.redirect(createOauthUrl(env.DISCORD_CLIENT_ID, url.origin + '/callback'), 302);
		} else if (url.pathname === '/callback') {
			let code = url.searchParams.get('code');
			if (code) {
				const r = await fetch('https://discord.com/api/v10/oauth2/token', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: new URLSearchParams({
						client_id: env.DISCORD_CLIENT_ID,
						client_secret: env.DISCORD_CLIENT_SECRET,
						grant_type: 'authorization_code',
						code: code,
						redirect_uri: url.origin + '/callback',
					}),
				});
				const data: AccessTokenResponse = await r.json();
				const token = data.access_token;
				// join to guild
				const res = await fetch('https://discord.com/api/v10/users/@me', {
					headers: {
						Authorization: 'Bearer ' + token,
					},
				});
				const user: User = await res.json();
				const resp = await fetch(`https://discord.com/api/v10/guilds/${env.DISCORD_GUILD_ID}/members/${user.id}`, {
					method: 'PUT',
					body: JSON.stringify({
						access_token: token,
					}),
					headers: {
						Authorization: 'Bot ' + env.DISCORD_TOKEN,
						'Content-Type': 'application/json',
					},
				});
				// console.log(await resp.json());
				return Response.redirect('https://discord.com/channels/' + env.DISCORD_GUILD_ID, 302);
			} else {
				return new Response('Missing code', { status: 400 });
			}
		} else {
			// Not found
			return new Response('Not found', { status: 404 });
		}
	},
};
