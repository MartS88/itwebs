export interface SendPasswordCodePayload {
	email: string;
	code:string,
	username:string,
}

export interface SendWelcomeMessage {
	email: string;
	username:string,
}