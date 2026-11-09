import React from "react";
import { DatePicker, Empty, Form, Image, Spin, Tabs } from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Cookies } from "react-cookie";
import { MdOutlineTranslate } from "react-icons/md";
import { FiExternalLink, FiFileText, FiImage } from "react-icons/fi";

import { useSelects } from "../../hooks/global/useSelectsHook";
import { useTicketLogs, useTicketsEdit, useUpdateTicket } from "../../hooks/dashboard/tickets/useTicketsHooks";
import { useUpdateAdminTimelineStatus } from "../../hooks/dashboard/tickets/useAdminTicketTimeline";
import { Buttons, SelectInput, TextInput, Modal } from "../common";
import { GetOptions, GetPermission } from "../../utils/Functions";
import { TicketObj } from "../../templates/inputs/TicketObj";
import { useGeminiSDK } from "../../hooks/global/useGeminiSDK";
import { getAttachmentName, getAttachmentUrl, isImageAttachment } from "../../utils/tickets";
import AdminTicketTimeline from "./AdminTicketTimeline";

dayjs.extend(customParseFormat);

const getLogBadge = (status, text) => {
    const normalizedText = String(text || "").toLowerCase();

    if (normalizedText.includes("view")) {
        return {
            label: "Visualizzato",
            className: "border-sky-200 bg-sky-50 text-sky-700",
        };
    }

    const statusMap = {
        0: {
            label: "Aperto",
            className: "border-orange-200 bg-orange-50 text-orange-700",
        },
        1: {
            label: "Approvato",
            className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        },
        2: {
            label: "In Progress",
            className: "border-indigo-200 bg-indigo-50 text-indigo-700",
        },
        3: {
            label: "Rifiutato",
            className: "border-rose-200 bg-rose-50 text-rose-700",
        },
    };

    return (
        statusMap[Number(status)] || {
            label: "Evento",
            className: "border-slate-200 bg-slate-50 text-slate-700",
        }
    );
};

const formatLogDate = (dateValue) => {
    if (!dateValue) {
        return "-";
    }

    const parsedDate = dayjs(dateValue, ["DD/MM/YYYY HH:mm", "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD"], true);
    return parsedDate.isValid() ? parsedDate.format("DD/MM/YYYY HH:mm") : dateValue;
};

const openAttachmentInNewTab = (url) => {
    if (!url) {
        return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
};

const TicketModalForm = ({ closeModal, detailsId, initialTab = "details" }) => {
    const [form] = Form.useForm();
    const cookies = new Cookies();

    const { data: selects } = useSelects();
    const [activeTab, setActiveTab] = React.useState(initialTab);

    const { data: ticketLogs = [], isLoading: isLogsLoading, isFetching: isLogsFetching, isError: isLogsError } = useTicketLogs(detailsId, activeTab === "logs");
    const { run } = useGeminiSDK();
    const [translate, setTranslate] = React.useState(false);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const attachments = Form.useWatch("attachments", form) || [];
    const description = Form.useWatch("description", form);

    React.useEffect(() => {
        setActiveTab(initialTab);
    }, [detailsId, initialTab]);

    const showModal = () => {
        setIsLoading(true);
        run(description).then((res) => {
            setTranslate(res);
            setIsLoading(false);
            setIsModalOpen(true);
        });
    };

    const TicketForm = TicketObj({
        customes: GetOptions(selects, "customers") || [],
        azienda: GetOptions(selects, "companies") || [],
        tags: GetOptions(selects, "parameters") || [],
        inEdit: true,
    }).map((input) => {
        const Component = input.type === "select" ? SelectInput : input.type === "date" ? DatePicker : TextInput;
        return (
            <Form.Item key={input.name} hidden={input?.hidden} label={input?.label} className="!mb-3" name={input?.name} rules={[input?.rules]}>
                <Component className="w-full" format="DD/MM/YYYY" rows={4} placeholder={input?.placeholder} size="large" options={input?.options} />
            </Form.Item>
        );
    });

    const ticketDetailsQuery = useTicketsEdit(detailsId, (data) => {
        const values = {
            ...data,
            closedAt: data?.closedAt ? dayjs(data?.closedAt, "YYYY-MM-DD HH:mm:ss") : "",
        };
        form.setFieldsValue(values);
    });
    const { mutate: update, isPending: isUpdating } = useUpdateTicket(() => {
        form.resetFields();
        closeModal();
    });
    const updateTimelineStatusMutation = useUpdateAdminTimelineStatus(detailsId);
    const updateTicketPermission = GetPermission("update_ticket");
    const canUpdateTicket = updateTicketPermission === true || Number(updateTicketPermission) === 1;

    const handleTimelineStatusChange = async (status) => {
        const currentValues = form.getFieldsValue(true);
        const closedAt = currentValues?.closedAt?.format
            ? currentValues.closedAt.format("YYYY-MM-DD")
            : currentValues?.closedAt || "";

        await updateTimelineStatusMutation.mutateAsync({
            ...currentValues,
            ticketId: detailsId,
            status,
            closedAt,
            _method: "PUT",
        });
        form.setFieldValue("status", status);
        await ticketDetailsQuery.refetch();
    };

    const formTabContent = (
        <Form
            form={form}
            name="customer"
            onFinish={(values) => update({ ...values, ticketId: detailsId, closedAt: values?.closedAt ? values?.closedAt?.format("YYYY-MM-DD") : "", _method: "PUT" })}
            layout="vertical">
            <section className="rounded-md border border-slate-200 bg-white p-4">
                <h2 className="mb-4 text-base font-semibold text-slate-800">Informazioni ticket</h2>
                <div className="grid gap-3 md:grid-cols-2">{TicketForm}</div>
            </section>

            {attachments.length > 0 && (
                <section className="mt-4 w-full rounded-md border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-slate-800">Allegati</h2>
                        <span className="text-xs font-medium text-slate-500">{attachments.length} file</span>
                    </div>
                    <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {attachments.map((file) => {
                            const url = getAttachmentUrl(file);
                            const name = getAttachmentName(file);
                            const isImage = isImageAttachment(file);

                            return (
                                <div key={file?.attachmentId || url} className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                                    {isImage ? (
                                        <Image
                                            src={url}
                                            className="w-full bg-slate-100 object-cover"
                                            preview={true}
                                            alt={name}
                                            style={{ height: "130px" }}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => openAttachmentInNewTab(url)}
                                            className="flex h-[130px] w-full flex-col items-center justify-center gap-2 bg-slate-100 p-4 text-center transition hover:bg-slate-200">
                                            <FiFileText className="text-3xl text-slate-500" />
                                            <span className="line-clamp-2 text-xs font-semibold text-slate-700">{name}</span>
                                        </button>
                                    )}
                                    <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
                                        <div className="flex min-w-0 items-center gap-2">
                                            {isImage ? <FiImage className="shrink-0 text-slate-500" /> : <FiFileText className="shrink-0 text-slate-500" />}
                                            <span className="truncate text-xs font-medium text-slate-700">{name}</span>
                                        </div>
                                        {!isImage && (
                                            <button
                                                type="button"
                                                onClick={() => openAttachmentInNewTab(url)}
                                                className="shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                                aria-label={`Apri ${name} in una nuova pagina`}>
                                                <FiExternalLink />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
            <section className="relative mt-4 w-full rounded-md border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-base font-semibold text-slate-800">Descrizione</h2>
                {cookies.get("role")?.name === "SuperAdmin" && (
                    <div onClick={() => showModal()} className="absolute right-3 top-3 cursor-pointer rounded-md bg-cyan-500 p-2">
                        {isLoading ? <Spin size="small" /> : <MdOutlineTranslate className="text-xl text-white" />}
                    </div>
                )}
                <pre className="w-full whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm font-medium leading-6 text-slate-800" dangerouslySetInnerHTML={{ __html: description }} />
            </section>
            <Buttons className="mt-4" type="primary" size="large" block loading={isUpdating} disabled={!detailsId} htmlType="submit">
                {detailsId ? "Modifica" : "Salva"}
            </Buttons>
        </Form>
    );

    const logsTabContent = (
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-800">Log approvazione ticket</h2>
                {isLogsFetching && !isLogsLoading && <p className="text-xs font-medium text-slate-500">Aggiornamento...</p>}
            </div>

            {isLogsLoading ? (
                <div className="flex min-h-[250px] items-center justify-center">
                    <Spin size="large" />
                </div>
            ) : isLogsError ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">Impossibile caricare i logs del ticket.</div>
            ) : ticketLogs.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 bg-white py-10">
                    <Empty description="Nessun log disponibile" />
                </div>
            ) : (
                <div className="space-y-3">
                    {ticketLogs.map((log, index) => {
                        const badge = getLogBadge(log?.status, log?.text);

                        return (
                            <article key={log?.ticketLogId || `${log?.createdAt || "log"}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
                                    <span className="text-xs font-medium text-slate-500">{formatLogDate(log?.createdAt)}</span>
                                </div>
                                <p className="mt-3 text-sm font-medium leading-6 text-slate-700">{log?.text || "Nessuna descrizione disponibile."}</p>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );

    const timelineTabContent = (
        <AdminTicketTimeline
            ticketId={detailsId}
            enabled={activeTab === "timeline"}
            canUpdate={canUpdateTicket}
            isUpdatingStatus={updateTimelineStatusMutation.isPending || ticketDetailsQuery.isPending}
            onUpdateStatus={handleTimelineStatusChange}
        />
    );

    return (
        <>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: "details",
                        label: "Dettagli ticket",
                        children: formTabContent,
                    },
                    {
                        key: "logs",
                        label: "Logs ticket",
                        children: logsTabContent,
                    },
                    {
                        key: "timeline",
                        label: "Cronologia",
                        children: timelineTabContent,
                    },
                ]}
            />

            <Modal isModalOpen={isModalOpen} onClose={() => setIsModalOpen(false)} width={600} title={"Translate Description"}>
                <pre className="whitespace-pre-wrap text-sm font-bold" dir="rtl" dangerouslySetInnerHTML={{ __html: translate }} />
            </Modal>
        </>
    );
};

export default TicketModalForm;
