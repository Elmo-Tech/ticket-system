import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { CUSTOMER_SESSION_DURATION, persistCustomerSession, readCustomerSession } from "../../utils/customerTickets";

const getStorage = () => {
    try {
        return window.sessionStorage;
    } catch {
        return null;
    }
};

const customerQueryPrefixes = ["customerTickets", "customerTicketDetails", "customerTicketTimeline"];

export const useCustomerTicketSession = () => {
    const queryClient = useQueryClient();
    const [identity, setIdentity] = useState(() => readCustomerSession(getStorage()));

    const clearIdentity = useCallback(() => {
        persistCustomerSession(getStorage(), null);
        setIdentity(null);
        const filters = { predicate: (query) => customerQueryPrefixes.includes(query.queryKey[0]) };
        queryClient.cancelQueries(filters);
        queryClient.removeQueries(filters);
    }, [queryClient]);

    const expireIdentity = useCallback(() => {
        clearIdentity();
        toast.info("La sessione è scaduta. Accedi nuovamente con username e PIN.");
    }, [clearIdentity]);

    const identifyCustomer = (data) => {
        if (!data?.token || !data?.ticketToken) {
            toast.error("Accesso ai ticket non disponibile. Riprova.");
            return;
        }
        // Store only access data, never the username/PIN request.
        const session = { token: data.token, ticketToken: data.ticketToken, name: data.name, tags: data.tags || [], expiresAt: Date.now() + CUSTOMER_SESSION_DURATION };
        persistCustomerSession(getStorage(), session);
        setIdentity(session);
    };

    useEffect(() => {
        if (!identity) {
            return;
        }
        const timer = window.setTimeout(expireIdentity, Math.max(identity.expiresAt - Date.now(), 0));
        return () => window.clearTimeout(timer);
    }, [identity, expireIdentity]);

    return { identity, identifyCustomer, clearIdentity, expireIdentity };
};
