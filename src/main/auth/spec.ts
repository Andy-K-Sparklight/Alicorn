export interface AuthCredentials {
    accessToken: string;
    uuid: string;
    xboxId: string;
    playerName: string;
}

export interface Account {
    uuid: string;

    /**
     * Refresh the account.
     */
    refresh(): Promise<boolean>;

    /**
     * Export credentials.
     */
    credentials(): AuthCredentials;
}