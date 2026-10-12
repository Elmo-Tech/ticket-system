import { Button, Modal, Skeleton } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useCustomerTicketTimeline, useSendCustomerTimelineMessage, useUpdateCustomerTimelineStatus } from "../../hooks/tickets/useTicketTimeline";
import { useCustomerTokenExpiry } from "../../hooks/tickets/useCustomerTickets";
import { getCustomerTicketErrorMessage } from "../../utils/customerTickets";
import { getCustomerStatusAction, getTimelineStatusLabel } from "../../utils/ticketTimeline";
import { TimelineList, TimelineReplyComposer } from "../TicketTimeline/TimelineConversation";
import CustomerTicketError from "./CustomerTicketError";

const CustomerTicketHistory = ({ ticket, token, onSessionExpired }) => {
    const queryClient = useQueryClient();
    const [modal, modalContext] = Modal.useModal();
    const timeline = useCustomerTicketTimeline(ticket.ticketId, ticket.timelineToken);
    const sendMessage = useSendCustomerTimelineMessage(ticket.ticketId, ticket.timelineToken);
    const updateStatus = useUpdateCustomerTimelineStatus(ticket.ticketId, ticket.timelineToken);
    useCustomerTokenExpiry(timeline.error, onSessionExpired);
    const status = timeline.data?.ticket?.status ?? ticket.status;
    const statusAction = getCustomerStatusAction(status);

    const handleStatusChange = () => {
        modal.confirm({
            title: statusAction.confirmationTitle,
            content: statusAction.confirmationText,
            okText: statusAction.label,
            cancelText: "Annulla",
            okButtonProps: { danger: statusAction.nextStatus === 1 },
            onOk: async () => {
                try {
                    await updateStatus.mutateAsync(statusAction.nextStatus);
                    await Promise.all([
                        queryClient.invalidateQueries({ queryKey: ["customerTickets", token] }),
                        queryClient.invalidateQueries({ queryKey: ["customerTicketDetails", token, ticket.ticketId] }),
                    ]);
                    toast.success(statusAction.nextStatus === 3 ? "Ticket riaperto con successo" : "Ticket chiuso con successo");
                } catch (error) {
                    toast.error(getCustomerTicketErrorMessage(error));
                    throw error;
                }
            },
        });
    };

    const handleSend = async (payload) => {
        try {
            await sendMessage.mutateAsync(payload);
            toast.success("Risposta inviata con successo");
            return true;
        } catch (error) {
            toast.error(getCustomerTicketErrorMessage(error));
            return false;
        }
    };

    const handleLoadOlder = async () => {
        try {
            await timeline.loadOlderMessages();
        } catch (error) {
            toast.error(getCustomerTicketErrorMessage(error));
        }
    };

    return (
        <section>
            {modalContext}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold">Cronologia del ticket</h3>
                    <p className="text-sm text-slate-500">Stato: {getTimelineStatusLabel(status)}</p>
                </div>
                <Button type="primary" danger={Number(status) !== 1} loading={updateStatus.isPending} disabled={timeline.isPending || timeline.isError} onClick={handleStatusChange}>
                    {statusAction.label}
                </Button>
            </div>
            {timeline.isPending ? <Skeleton active paragraph={{ rows: 5 }} /> : timeline.isError ? (
                <CustomerTicketError error={timeline.error} onRetry={() => timeline.refetch()} />
            ) : (
                <>
                    <p className="mb-4 text-sm text-slate-500">{timeline.data.pagination.total} aggiornamenti</p>
                    {timeline.hasOlderMessages && (
                        <Button className="mb-4" loading={timeline.isLoadingOlderMessages} onClick={handleLoadOlder}>Carica aggiornamenti precedenti</Button>
                    )}
                    <TimelineList messages={timeline.data.ticketMessages} currentActorType={2} />
                    <TimelineReplyComposer isClosed={Number(status) === 1} isSending={sendMessage.isPending} onSend={handleSend} resetKey={ticket.ticketId} />
                </>
            )}
        </section>
    );
};

export default CustomerTicketHistory;
