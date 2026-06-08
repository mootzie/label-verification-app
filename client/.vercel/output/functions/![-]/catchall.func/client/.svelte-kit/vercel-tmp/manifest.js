export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["demo/bulk-1.png","demo/bulk-2.png","demo/bulk-3.png","demo/bulk-4.png","demo/bulk-5.png","demo/single-1.png","demo/single-2.png","demo/single-3.png","demo/single-4.png","demo/single-5.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.BhSFQUDg.js",app:"_app/immutable/entry/app.CbTtyfCs.js",imports:["_app/immutable/entry/start.BhSFQUDg.js","_app/immutable/chunks/DBxKUQVq.js","_app/immutable/chunks/CaNPQU-j.js","_app/immutable/chunks/CimZOwNs.js","_app/immutable/entry/app.CbTtyfCs.js","_app/immutable/chunks/CaNPQU-j.js","_app/immutable/chunks/B5W7xRX5.js","_app/immutable/chunks/RnfSjAcc.js","_app/immutable/chunks/CimZOwNs.js","_app/immutable/chunks/Cy9-SKnC.js","_app/immutable/chunks/DQ7AuZaX.js","_app/immutable/chunks/8v2QckrT.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js')),
			__memo(() => import('../output/server/nodes/4.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/batch",
				pattern: /^\/batch\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/docs",
				pattern: /^\/docs\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
