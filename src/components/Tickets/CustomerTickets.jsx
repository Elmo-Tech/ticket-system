import { useState } from "react";
import { Alert, Button, Empty, Form, Pagination, Skeleton, Tag } from "antd";
import { ArrowLeftOutlined, SearchOutlined, SyncOutlined } from "@ant-design/icons";

import { useCustomerTicketDetails, useCustomerTickets, useCustomerTokenExpiry } from "../../hooks/tickets/useCustomerTickets";
import { getTimelineStatusLabel, timelineStatusOptions } from "../../utils/ticketTimeline";
import { UrgenzaOptions } from "../../utils/Functions";
import { formatTimelineDate, TimelineAttachmentList } from "../TicketTimeline/TimelineConversation";
import CustomerTicketHistory from "./CustomerTicketHistory";
import CustomerTicketError from "./CustomerTicketError";
import { SelectInput, TextInput } from "../common";

export const CustomerTicketBadges = ({ ticket }) => (
    <div className="flex flex-wrap gap-2">
        <Tag color={{ 0: "blue", 1: "green", 2: "purple", 3: "cyan" }[ticket.status]}>{getTimelineStatusLabel(ticket.status)}</Tag>
        <Tag color={{ 0: "green", 1: "gold", 2: "red" }[ticket.importance]}>
            Urgenza: {UrgenzaOptions.find((option) => option.value === Number(ticket.importance))?.label || "Sconosciuta"}
        </Tag>
    </div>
);

const CustomerTicketDetails = ({ token, ticketId, summary, onBack, onSessionExpired }) => {
    const detailsQuery = useCustomerTicketDetails(token, ticketId);
    useCustomerTokenExpiry(detailsQuery.error, onSessionExpired);
    const ticket = detailsQuery.data;

    return (
        <div>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack} className="mb-5">Torna ai miei ticket</Button>
            {detailsQuery.isPending ? <Skeleton active paragraph={{ rows: 6 }} /> : detailsQuery.isError ? (
                <CustomerTicketError error={detailsQuery.error} onRetry={() => detailsQuery.refetch()} />
            ) : (
                <>
                    <div className="mb-6 rounded-xl border border-slate-200 p-4">
                        <h2 className="mb-3 break-words text-xl font-bold">{ticket.ticketNumber}</h2>
                        <CustomerTicketBadges ticket={ticket} />
                        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                            <div><dt className="text-slate-500">Cliente</dt><dd>{summary.customerName}</dd></div>
                            <div><dt className="text-slate-500">Azienda / Sede</dt><dd>{[summary.companyName, summary.branchName].filter(Boolean).join(" / ") || "—"}</dd></div>
                            <div><dt className="text-slate-500">Data di apertura</dt><dd>{summary.createdAt || "—"}</dd></div>
                            <div><dt className="text-slate-500">Data di chiusura</dt><dd>{formatTimelineDate(ticket.closedAt, "Non ancora chiuso")}</dd></div>
                        </dl>
                        <h3 className="mt-4 font-semibold">Descrizione</h3>
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm">{ticket.description || "—"}</p>
                        <TimelineAttachmentList attachments={ticket.attachments || []} />
                    </div>
                    {ticket.timelineToken ? (
                        <CustomerTicketHistory ticket={ticket} token={token} onSessionExpired={onSessionExpired} />
                    ) : (
                        <Alert
                            type="info"
                            showIcon
                            message="Cronologia non disponibile per questo ticket"
                            description="Questo ticket precedente non dispone di un accesso alla cronologia. Per riaprirlo, contatta il team di assistenza."
                        />
                    )}
                </>
            )}
        </div>
    );
};

const CustomerTickets = ({ token, onCreateTicket, onSessionExpired }) => {
    const [filterForm] = Form.useForm();
    const [filters, setFilters] = useState({});
    const [page, setPage] = useState(1);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const ticketsQuery = useCustomerTickets(token, page, filters);
    useCustomerTokenExpiry(ticketsQuery.error, onSessionExpired);
    const tickets = ticketsQuery.data?.result?.tickets || [];
    const pagination = ticketsQuery.data?.pagination;
    const hasFilters = filters.status !== undefined || Boolean(filters.description);

    const applyFilters = (values) => {
        setPage(1);
        setFilters({
            status: values.status ?? undefined,
            description: values.description?.trim() || undefined,
        });
    };

    const clearFilters = () => {
        filterForm.setFieldsValue({ status: undefined, description: "" });
        setPage(1);
        setFilters({});
    };

    if (selectedTicket) {
        return <CustomerTicketDetails key={selectedTicket.ticketId} token={token} ticketId={selectedTicket.ticketId} summary={selectedTicket} onBack={() => setSelectedTicket(null)} onSessionExpired={onSessionExpired} />;
    }

    return (
        <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold">I miei ticket</h2>
                    <p className="text-sm text-slate-500">Tutti i tuoi ticket, aperti e chiusi, dal più recente.</p>
                </div>
                <Button icon={<SyncOutlined />} loading={ticketsQuery.isFetching} onClick={() => ticketsQuery.refetch()}>Aggiorna</Button>
            </div>
            <Form
                form={filterForm}
                name="customer-ticket-filters"
                layout="vertical"
                initialValues={filters}
                onFinish={applyFilters}
                className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <Form.Item name="status" label="Stato">
                        <SelectInput allowClear placeholder="Tutti gli stati" options={timelineStatusOptions} />
                    </Form.Item>
                    <Form.Item name="description" label="Cerca nella descrizione">
                        <TextInput placeholder="Testo della descrizione" />
                    </Form.Item>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={ticketsQuery.isFetching}>Filtra</Button>
                    <Button onClick={clearFilters}>Cancella filtri</Button>
                </div>
            </Form>
            {ticketsQuery.isPending ? <Skeleton active paragraph={{ rows: 8 }} /> : ticketsQuery.isError ? (
                <CustomerTicketError error={ticketsQuery.error} onRetry={() => ticketsQuery.refetch()} />
            ) : tickets.length === 0 ? (
                <Empty description={hasFilters ? "Nessun ticket corrisponde ai filtri" : "Non hai ancora ticket"}>
                    {hasFilters ? (
                        <Button onClick={clearFilters}>Mostra tutti i ticket</Button>
                    ) : (
                        <Button type="primary" onClick={onCreateTicket}>Crea il tuo primo ticket</Button>
                    )}
                </Empty>
            ) : (
                <>
                    <div className="space-y-3">
                        {tickets.map((ticket) => (
                            <article key={ticket.ticketId} className="rounded-xl border border-slate-200 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <h3 className="min-w-0 break-words font-bold">{ticket.ticketNumber}</h3>
                                    <CustomerTicketBadges ticket={ticket} />
                                </div>
                                <p className="my-3 line-clamp-2 whitespace-pre-wrap break-words text-sm text-slate-600">{ticket.description}</p>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-xs text-slate-500">Apertura: {ticket.createdAt || "—"}{ticket.closedAt ? ` · Chiusura: ${ticket.closedAt}` : ""}</p>
                                    <Button type="primary" onClick={() => setSelectedTicket(ticket)}>Dettagli e cronologia</Button>
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className="mt-5 flex justify-center">
                        <Pagination current={Number(pagination.currentPage)} total={Number(pagination.total)} pageSize={Number(pagination.perPage)} showSizeChanger={false} onChange={setPage} hideOnSinglePage />
                    </div>
                </>
            )}
        </section>
    );
};

export default CustomerTickets;
