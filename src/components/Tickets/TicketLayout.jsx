import React from "react";
import { Image } from "antd";

import ticketImage from "../../assets/ticketing-system.png";
import TicketForm from "./TicketForm";

const TicketLayout = ({ form = <TicketForm />, sidePanel }) => {
    return (
        <div className={sidePanel ? "mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-4 bg-slate-50 p-4 lg:flex-row lg:items-start" : "flex min-h-screen justify-between gap-4"}>
            <div className={sidePanel ? "flex min-w-0 flex-1 items-start justify-center rounded-lg bg-white" : "flex flex-1 items-center justify-center bg-white"}>
                {form}
            </div>
            {sidePanel ? (
                <div className="flex min-w-0 flex-1 justify-center rounded-lg bg-white">
                    {sidePanel}
                </div>
            ) : (
                <div className="hidden flex-1 items-center bg-white lg:flex">
                    <Image
                        src={ticketImage}
                        alt="Ticketing System"
                        preview={false}
                        className="size-full object-cover"
                    />
                </div>
            )}
        </div>
    );
};

export default TicketLayout;
