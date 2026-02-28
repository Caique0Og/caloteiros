/// <reference types="vite/client" />

// add EmailJS environment variables used by the project
interface ImportMetaEnv {
	readonly VITE_EMAILJS_PUBLIC_KEY: string;
	readonly VITE_EMAILJS_SERVICE_ID: string;
	readonly VITE_EMAILJS_TEMPLATE_ID: string;
	// the private key should never be included in frontend env, but if you
	// somehow need to reference it in an edge function you can add it here
	readonly VITE_EMAILJS_PRIVATE_KEY?: string;
}
