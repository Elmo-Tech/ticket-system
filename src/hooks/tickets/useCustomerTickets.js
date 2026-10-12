import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import publicApi from "../../services/publicApi";
import { isCustomerTokenError } from "../../utils/customerTickets";

export const useCustomerTickets = (token, page, filters = {}) => useQuery({
    queryKey: ["customerTickets", token, page, filters],
    queryFn: async ({ signal }) => {
        const { data } = await publicApi.get("customer/tickets", {
            params: {
                token,
                page,
                pageSize: 10,
                "filter[status]": filters.status ?? undefined,
                "filter[description]": filters.description || undefined,
            },
            signal,
        });
        if (!Array.isArray(data?.result?.tickets) || !data?.pagination) {
            throw new Error("INVALID_CUSTOMER_TICKETS_RESPONSE");
        }
        return data;
    },
    enabled: Boolean(token),
    retry: false,
});

export const useCustomerTicketDetails = (token, ticketId) => useQuery({
    queryKey: ["customerTicketDetails", token, ticketId],
    queryFn: async ({ signal }) => {
        const { data } = await publicApi.get("customer/tickets/show", {
            params: { token, ticketId },
            signal,
        });
        if (!data?.ticketId) {
            throw new Error("INVALID_CUSTOMER_TICKET_RESPONSE");
        }
        return data;
    },
    enabled: Boolean(token && ticketId),
    retry: false,
});

export const useCustomerTokenExpiry = (error, onSessionExpired) => {
    useEffect(() => {
        if (isCustomerTokenError(error)) {
            onSessionExpired();
        }
    }, [error, onSessionExpired]);
};
