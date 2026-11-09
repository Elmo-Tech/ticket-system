import { keepPreviousData, useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";

import { sumErrors } from "../../../utils/Functions";

export const useTickets = (pagination, setPagination) => {
    const getTickets = async () => {
        const response = await axios.get("admin/tickets", {
            params: {
                page: pagination?.current,
                pageSize: pagination?.pageSize,
                filter: pagination?.filter,
            },
        });

        const {
            data: {
                pagination: { total, per_page: pageSize, current_page: current },
                result: { tickets },
            },
        } = response;

        setPagination({ position: ["bottomLeft"], total, pageSize, current });
        return tickets.map((ticket) => ({ ...ticket, key: ticket.ticketId }));
    };

    return useQuery({
        queryKey: ["tickets", pagination],
        queryFn: () => getTickets(),
        placeholderData: keepPreviousData,
    });
};

export const useAllTickets = (pagination) => {
    const getAllTickets = async () => {
        // First, get the first page to determine total count
        const firstResponse = await axios.get("admin/tickets", {
            params: {
                page: 1,
                pageSize: 100, // Use a large page size to reduce number of calls
                filter: pagination?.filter,
            },
        });

        const {
            data: {
                pagination: { total },
                result: { tickets: firstTickets },
            },
        } = firstResponse;

        // If total is less than or equal to first page size, return what we have
        if (total <= 100) {
            return firstTickets.map((ticket) => ({ ...ticket, key: ticket.ticketId }));
        }

        // Calculate number of pages needed
        const totalPages = Math.ceil(total / 100);
        const allTickets = [...firstTickets];

        // Fetch remaining pages in parallel (batches of 5 to avoid overwhelming the server)
        for (let i = 2; i <= totalPages; i += 5) {
            const batchPromises = [];
            for (let j = i; j < i + 5 && j <= totalPages; j++) {
                batchPromises.push(
                    axios.get("admin/tickets", {
                        params: {
                            page: j,
                            pageSize: 100,
                            filter: pagination?.filter,
                        },
                    })
                );
            }

            const batchResponses = await Promise.all(batchPromises);
            batchResponses.forEach((response) => {
                const tickets = response.data.result.tickets;
                allTickets.push(...tickets);
            });
        }

        return allTickets.map((ticket) => ({ ...ticket, key: ticket.ticketId }));
    };

    return useQuery({
        queryKey: ["ticketsAll", pagination?.filter],
        queryFn: () => getAllTickets(),
        enabled: false, // Only fetch when explicitly called
    });
};

export const useCreateTicket = (resetForm) => {
    return useMutation({
        mutationFn: (data) => {
            return axios.post("https://customerservicebe.testingelmo.com/api/v1/tickets/create", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
        },
        onSuccess: () => {
            toast.success("Ticket created successfully");
            resetForm();
        },
        onError: (error) => {
            const message = error?.response?.data?.message;
            const typeMessage = typeof message;

            const errors = typeMessage === "string" ? [message] : sumErrors(message);
            errors.forEach((error) => toast.error(error));
        },
    });
};

export const useTicketsEdit = (id, updateForm) => {
    const getTicket = async () => {
        const response = await axios.get(`admin/tickets/edit`, { params: { ticketId: id } });
        updateForm(response.data);
        return response.data;
    };
    return useQuery({
        queryKey: ["ticketEdit", id],
        queryFn: () => getTicket(),
        enabled: !!id,
    });
};

export const useTicketLogs = (ticketId, enabled = true) => {
    const getTicketLogs = async () => {
        const response = await axios.get("ticket-logs", {
            params: {
                ticketId,
            },
        });

        return response?.data?.data || [];
    };

    return useQuery({
        queryKey: ["ticketLogs", ticketId],
        queryFn: () => getTicketLogs(),
        enabled: !!ticketId && enabled,
    });
};

export const usePublicTicket = (ticketId, token) => {
    const getPublicTicket = async () => {
        const response = await axios.get("public/ticket", {
            params: {
                ticketId,
                token,
            },
        });

        return response?.data?.data;
    };

    return useQuery({
        queryKey: ["publicTicket", ticketId, token],
        queryFn: () => getPublicTicket(),
        enabled: !!ticketId && !!token,
        retry: false,
    });
};

export const useUpdateTicket = (closeModel) => {
    return useMutation({
        mutationFn: (data) => {
            return axios.post("admin/tickets/update", data,{
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
        },
        onSuccess: () => {
            toast.success("Ticket updated successfully");
            closeModel();
        },
        onError: (error) => {
            const message = error?.response?.data?.message;
            const typeMessage = typeof message;

            const errors = typeMessage === "string" ? [message] : sumErrors(message);
            errors.forEach((error) => toast.error(error));
        },
    });
};

export const useCreateTicketLog = (afterSuccess) => {
    return useMutation({
        mutationFn: (data) => axios.post("ticket-logs", data),
        onSuccess: () => {
            toast.success("Review sent successfully");
            afterSuccess?.();
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error?.response?.data;
            const typeMessage = typeof message;

            const errors = typeMessage === "string" ? [message] : message ? sumErrors(message) : ["Something went wrong"];
            errors.forEach((error) => toast.error(error));
        },
    });
};

export const useDeleteTicket = (refetch) => {
    const queryClient = new QueryClient();

    return useMutation({
        mutationFn: (params) => axios.delete(`admin/tickets/delete`, { params }),
        onSuccess: () => {
            queryClient.invalidateQueries(["tickets"]);
            toast.info("Ticket deleted successfully");
            refetch();
        },
        onError: (error) => {
            const message = error?.response?.data?.message;
            const typeMessage = typeof message;

            const errors = typeMessage === "string" ? [message] : sumErrors(message);
            errors.forEach((error) => toast.error(error));
        },
    });
};
