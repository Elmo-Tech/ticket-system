import { StatusOptions, UrgenzaOptions } from "../../utils/Functions";
import { timelineStatusOptions } from "../../utils/ticketTimeline";
import { getTicketTagOptions } from "../../utils/ticketTags";

export const TicketObj = ({ customes, azienda, tags, inEdit }) => {
	return [
		{
			name: "customerId",
			label: "Nome",
			type: "select",
			placeholder: "Inserisci il nome",
			rules: { required: true, message: "Inserisci il nome" },
			options: customes,
		},
		{
			name: "pin",
			label: "PIN",
			type: "text",
			placeholder: "Inserisci il pin",
			rules: { required: !inEdit, message: "Inserisci il pin" },
			hidden: inEdit,
		},
		{
			name: "importance",
			label: "Urgenza",
			type: "select",
			placeholder: "Inserisci la urgenza",
			rules: { required: true, message: "Inserisci la urgenza" },
			options: UrgenzaOptions,
		},
		{
			name: "companyId",
			label: "Azienda",
			type: "select",
			placeholder: "Inserisci la azienda",
			rules: { required: true, message: "Inserisci la azienda" },
			options: azienda,
		},
		{
			name: "tagId",
			label: "Tag",
			type: "select",
			placeholder: "Inserisci la Tag",
			rules: { required: false, message: "Inserisci la Tag" },
			options: getTicketTagOptions(tags),
		},
		{
			name: "status",
			label: "Stato",
			type: "select",
			placeholder: "Inserisci la stato",
			options: inEdit ? timelineStatusOptions : StatusOptions,
			hidden: !inEdit,
		},
		{
			name: "closedAt",
			label: "Data chiusura",
			type: "date",
			placeholder: "Inserisci la data di chiusura",
			hidden: !inEdit,
		},
		{
			name: "branchId",
			label: "Azienda",
			type: "select",
			placeholder: "Inserisci la branch",
			options: azienda,
			hidden: inEdit || !inEdit,
		},
		{
			name: "attachments",
			label: "Immagine",
			type: "image",
			placeholder: "Inserisci l'immagine",
			hidden: true,
		},
		{
			name: "description",
			label: "Descrizione",
			type: "text",
			placeholder: "Inserisci la descrizione",
			hidden: true,
		},
	];
};
