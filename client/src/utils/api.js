const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const request = async (path, method = "GET", body) => {
	const res = await fetch(`${API_URL}${path}`, {
		method,
		credentials: "include", // sends the session cookie
		headers: { "Content-Type": "application/json" },
		body: body ? JSON.stringify(body) : undefined,
	});
	const data = await res.json();
	if (!res.ok) throw new Error(data.error || "Something went wrong");
	return data;
};

export const api = {
	me: () => request("/me"),
	signup: (body) => request("/signup", "POST", body),
	login: (body) => request("/login", "POST", body),
	logout: () => request("/logout", "POST"),
	getApps: () => request("/applications"),
	createApp: (body) => request("/applications", "POST", body),
	updateApp: (id, body) => request(`/applications/${id}`, "PATCH", body),
	updateStatus: (id, status) => request(`/applications/${id}`, "PATCH", { status }),
	deleteApp: (id) => request(`/applications/${id}`, "DELETE"),
};