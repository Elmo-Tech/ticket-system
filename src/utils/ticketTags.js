const ticketTagLabels = new Map([
    ["general", "GENERICO"],
    ["riunione gnp", "MIGLIORIA"],
    ["sistemistico", "SISTEMISTICO"],
    ["errore gnp", "ERRORE SOFTWARE"],
]);

export const getTicketTagOptions = (tags = []) => (tags || []).map((tag) => ({
    ...tag,
    label: ticketTagLabels.get(String(tag.label || "").trim().toLowerCase()) || tag.label,
}));
