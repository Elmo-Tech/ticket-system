import React from "react";
import dayjs from "dayjs";
import { Alert, Button, Empty, Image, Input, Upload } from "antd";
import { DownloadOutlined, FileOutlined, MessageOutlined, PaperClipOutlined, SendOutlined, SyncOutlined } from "@ant-design/icons";

import { getAttachmentName, getAttachmentUrl, isImageAttachment } from "../../utils/tickets";
import { getTimelineActorLabel, getTimelineStatusLabel } from "../../utils/ticketTimeline";

const { TextArea } = Input;

export const formatTimelineDate = (value, emptyValue = "Non disponibile") => {
    if (!value) {
        return emptyValue;
    }

    const parsedDate = dayjs(value);
    return parsedDate.isValid() ? parsedDate.format("DD/MM/YYYY HH:mm") : value;
};

export const TimelineAttachmentList = ({ attachments = [] }) => {
    if (attachments.length === 0) {
        return null;
    }

    return (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {attachments.map((attachment, index) => {
                const url = getAttachmentUrl(attachment);
                const name = getAttachmentName(attachment);
                const key = attachment?.id || `${name}-${index}`;

                if (url && isImageAttachment(attachment)) {
                    return (
                        <div key={key} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                            <Image
                                src={url}
                                alt={name}
                                className="!h-28 !w-full rounded-lg object-cover"
                                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='112'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3C/svg%3E"
                            />
                            <p className="mt-2 truncate px-1 text-xs font-medium text-slate-600" title={name}>{name}</p>
                        </div>
                    );
                }

                return (
                    <a
                        key={key}
                        href={url || undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                    >
                        <FileOutlined className="text-lg" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium" title={name}>{name}</span>
                        <DownloadOutlined />
                    </a>
                );
            })}
        </div>
    );
};

const TimelineMessage = ({ item, currentActorType }) => {
    const isCurrentActor = Number(item?.actorType) === Number(currentActorType);
    const actorName = item?.userName || getTimelineActorLabel(item?.actorType);

    return (
        <div className={`flex ${isCurrentActor ? "justify-end" : "justify-start"}`}>
            <article
                className={`max-w-[88%] rounded-2xl p-4 shadow-sm sm:max-w-[78%] ${
                    isCurrentActor
                        ? "rounded-br-md bg-blue-700 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                }`}
            >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-bold">{actorName}</span>
                    <span className={`text-xs ${isCurrentActor ? "text-blue-100" : "text-slate-400"}`}>
                        {getTimelineActorLabel(item?.actorType)}
                    </span>
                </div>
                <p className={`mt-1 text-xs ${isCurrentActor ? "text-blue-100" : "text-slate-400"}`}>
                    {formatTimelineDate(item?.createdAt)}
                </p>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{item?.message || "—"}</p>
                <TimelineAttachmentList attachments={item?.attachments || []} />
            </article>
        </div>
    );
};

const StatusEvent = ({ item }) => {
    const actorName = item?.userName || getTimelineActorLabel(item?.actorType);

    return (
        <div className="flex justify-center py-1">
            <div className="max-w-[92%] rounded-full border border-slate-200 bg-white px-4 py-2 text-center shadow-sm">
                <p className="text-xs font-medium text-slate-600">
                    <SyncOutlined className="mr-2 text-blue-600" />
                    {actorName} ha cambiato lo stato da <strong>{getTimelineStatusLabel(item?.oldStatus)}</strong> a{" "}
                    <strong>{getTimelineStatusLabel(item?.newStatus)}</strong>
                </p>
                <p className="mt-1 text-[11px] text-slate-400">{formatTimelineDate(item?.createdAt)}</p>
            </div>
        </div>
    );
};

const UnknownEvent = ({ item }) => (
    <div className="flex justify-center py-1">
        <div className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-center text-xs text-slate-600">
            Aggiornamento del ticket · {formatTimelineDate(item?.createdAt)}
        </div>
    </div>
);

export const TimelineList = ({ messages, currentActorType }) => {
    if (messages.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nessun aggiornamento disponibile" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {messages.map((item, index) => {
                const key = item?.id || `${item?.createdAt}-${index}`;

                if (Number(item?.type) === 1) {
                    return <TimelineMessage key={key} item={item} currentActorType={currentActorType} />;
                }

                if (Number(item?.type) === 2) {
                    return <StatusEvent key={key} item={item} />;
                }

                return <UnknownEvent key={key} item={item} />;
            })}
        </div>
    );
};

export const TimelineReplyComposer = ({
    isClosed,
    isSending,
    canReply = true,
    onSend,
    resetKey,
    description = "Il nostro team vedrà il messaggio nella cronologia.",
    helperText,
}) => {
    const [message, setMessage] = React.useState("");
    const [fileList, setFileList] = React.useState([]);
    const isDisabled = isClosed || !canReply;
    const isSubmitDisabled = isDisabled || !message.trim();

    React.useEffect(() => {
        setMessage("");
        setFileList([]);
    }, [resetKey]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isSubmitDisabled) {
            return;
        }

        const attachments = fileList.map((file) => file.originFileObj || file);
        const wasSent = await onSend({ message: message.trim(), attachments });

        if (wasSent) {
            setMessage("");
            setFileList([]);
        }
    };

    return (
        <section className="mt-6 border-t border-slate-100 pt-6">
            <div className="mb-4 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <MessageOutlined />
                </span>
                <div>
                    <h2 className="font-bold text-slate-900">Invia una risposta</h2>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
            </div>

            {!canReply && (
                <Alert
                    showIcon
                    type="warning"
                    className="mb-4"
                    message="Modalità sola lettura"
                    description="Non disponi del permesso necessario per rispondere o modificare questo ticket."
                />
            )}

            {canReply && isClosed && (
                <Alert
                    showIcon
                    type="info"
                    className="mb-4"
                    message="Il ticket è chiuso"
                    description="Riapri il ticket per inviare una nuova risposta."
                />
            )}

            <form onSubmit={handleSubmit}>
                <label htmlFor={`timeline-message-${resetKey || "ticket"}`} className="mb-2 block text-sm font-semibold text-slate-700">
                    Messaggio
                </label>
                <TextArea
                    id={`timeline-message-${resetKey || "ticket"}`}
                    rows={5}
                    value={message}
                    disabled={isDisabled}
                    maxLength={5000}
                    showCount
                    placeholder="Scrivi qui il tuo messaggio..."
                    onChange={(event) => setMessage(event.target.value)}
                />

                {helperText && <p className="mt-2 text-xs text-slate-500">{helperText}</p>}

                <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                    <Upload
                        multiple
                        disabled={isDisabled}
                        fileList={fileList}
                        beforeUpload={() => false}
                        onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
                    >
                        <Button icon={<PaperClipOutlined />} disabled={isDisabled}>Aggiungi allegati</Button>
                    </Upload>

                    <Button
                        type="primary"
                        size="large"
                        htmlType="submit"
                        icon={<SendOutlined />}
                        loading={isSending}
                        disabled={isSubmitDisabled}
                    >
                        Invia risposta
                    </Button>
                </div>
            </form>
        </section>
    );
};
