import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import publicApi from "../../services/publicApi";

const showErrors = (error) => {
    const response = error?.response?.data;
    const validationErrors = response?.errors || (typeof response?.message === "object" ? response.message : null);
    const messages = validationErrors
        ? Object.values(validationErrors).flat()
        : [typeof response?.message === "string" ? response.message : "Something went wrong"];

    messages.forEach((message) => toast.error(message));
};

export const useIdentifyPublicTicketRequester = (afterSuccess) => {
    return useMutation({
        mutationFn: (credentials) => publicApi.post("public/tickets/identify", { ...credentials, pin: String(credentials.pin) }),
        onSuccess: ({ data }) => afterSuccess(data.data),
        onError: showErrors,
    });
};

export const useCreatePublicTicket = (afterSuccess, afterError) => {
    return useMutation({
        mutationFn: ({ attachments = [], ...fields }) => {
            const formData = new FormData();

            Object.entries(fields).forEach(([name, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(name, value);
                }
            });
            attachments.forEach((file) => formData.append("attachments[]", file));

            return publicApi.post("public/tickets/create", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => {
            toast.success("Ticket created successfully");
            afterSuccess();
        },
        onError: (error) => {
            showErrors(error);
            afterError?.(error);
        },
    });
};
