export const CUSTOMER_SESSION_KEY = "elmo.customerTicketSession";
export const CUSTOMER_SESSION_DURATION = 24 * 60 * 60 * 1000;

export const isCustomerTokenError = (error) => (
    error?.response?.status === 422 && Boolean(error?.response?.data?.errors?.token)
);

export const getCustomerTicketErrorMessage = (error) => {
    if (error?.response?.status === 429) {
        return "Troppe richieste. Attendi qualche istante prima di riprovare.";
    }
    if (error?.response?.status === 404) {
        return "Il ticket non è disponibile o non appartiene al tuo account.";
    }
    const data = error?.response?.data;
    const errors = data?.errors || (typeof data?.message === "object" ? data.message : null);
    const messages = errors ? Object.values(errors).flat().filter((value) => typeof value === "string") : [];
    return messages.join(" ") || (typeof data?.message === "string" ? data.message : "Impossibile caricare i ticket. Riprova.");
};

export const readCustomerSession = (storage, now = Date.now()) => {
    try {
        const session = JSON.parse(storage.getItem(CUSTOMER_SESSION_KEY));
        if (session?.token && session?.ticketToken && Number(session.expiresAt) > now) {
            return session;
        }
        storage.removeItem(CUSTOMER_SESSION_KEY);
    } catch {
        // Access still works in memory if browser storage is unavailable.
    }
    return null;
};

export const persistCustomerSession = (storage, session) => {
    try {
        if (session) {
            storage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
        } else {
            storage.removeItem(CUSTOMER_SESSION_KEY);
        }
    } catch {
        // Access still works in memory if browser storage is unavailable.
    }
};
