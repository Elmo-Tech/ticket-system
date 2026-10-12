import { useId } from "react";
import { CalendarOutlined, ClockCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";

const priorities = [
    {
        title: "Rosso – Critico",
        description: "Blocco totale del sistema o software, che impedisce all’utente di lavorare. Richiede intervento immediato.",
        icon: <ExclamationCircleOutlined />,
        cardTone: "border-red-200 bg-red-50",
        iconTone: "bg-red-100 text-red-700",
        titleTone: "text-red-800",
    },
    {
        title: "Giallo – Urgente",
        description: "Problema che richiede un intervento prioritario, ma non impedisce completamente l'operatività.",
        icon: <ClockCircleOutlined />,
        cardTone: "border-amber-200 bg-amber-50",
        iconTone: "bg-amber-100 text-amber-700",
        titleTone: "text-amber-800",
    },
    {
        title: "Verde – Da pianificare",
        description: "Attività non urgente, ancora in attesa di pianificazione.",
        icon: <CalendarOutlined />,
        cardTone: "border-green-200 bg-green-50",
        iconTone: "bg-green-100 text-green-700",
        titleTone: "text-green-800",
    },
];

const PriorityLegend = () => {
    const headingId = useId();

    return (
        <section aria-labelledby={headingId} className="mb-6 rounded-2xl border border-slate-200 p-4">
            <h3 id={headingId} className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <InfoCircleOutlined aria-hidden="true" className="text-blue-600" />
                Legenda dei colori
            </h3>
            <dl className="space-y-3">
                {priorities.map((priority) => (
                    <div key={priority.title} className={`rounded-xl border p-3 ${priority.cardTone}`}>
                        <dt className={`flex items-center gap-3 text-sm font-bold ${priority.titleTone}`}>
                            <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-base ${priority.iconTone}`}>
                                {priority.icon}
                            </span>
                            {priority.title}:
                        </dt>
                        <dd className="mt-2 text-sm leading-6 text-slate-700">{priority.description}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
};

export default PriorityLegend;
