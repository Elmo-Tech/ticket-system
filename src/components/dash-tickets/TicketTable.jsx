import React from "react";

import { Modal, Table, TableHeader, UiContainer } from "../../components/common";
import { useFilter, useTable } from "../../store";

import { TicketColumnObj } from "../../templates/column/TicketColumnObj";
import { useDeleteTicket, useTickets, useAllTickets } from "../../hooks/dashboard/tickets/useTicketsHooks";
import TicketModalForm from "./TicketModalForm";

const TicketTable = () => {
    const { filterData } = useFilter();
    const { pagenation, setPagenation } = useTable();

    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [detailsId, setDetailsId] = React.useState(null);
    const [initialTab, setInitialTab] = React.useState("details");

    const { data: tickets, isLoading, refetch } = useTickets({ ...pagenation, filter: filterData }, setPagenation);
    const { mutate: deleteTicket } = useDeleteTicket(refetch);
    
    // New hook for fetching all tickets for export
    const { refetch: fetchAllTickets } = useAllTickets({ filter: filterData });

    const openTicket = (id, tab) => {
        setInitialTab(tab);
        setIsModalOpen(true);
        setDetailsId(id);
    };

    const columns = TicketColumnObj({
        deleteFunction: (id) => deleteTicket({ ticketId: id }),
        viewFunction: (id) => openTicket(id, "details"),
        timelineFunction: (id) => openTicket(id, "timeline"),
    });

    // Function to fetch all tickets and return data for export
    const handleFetchAllForExport = async () => {
        const result = await fetchAllTickets();
        // useQuery returns { data, error, isLoading, etc. } from refetch
        return result?.data || [];
    };

    return (
        <UiContainer>
            <TableHeader
                ListName={"Tickets"}
                dataLength={pagenation?.total}
                data={tickets}
                columns={columns}
                fetchAll={handleFetchAllForExport}
            />

            <Table
                loadingTable={isLoading}
                onChange={setPagenation}
                tableParams={pagenation}
                isPagination={true}
                columns={columns}
                data={tickets}
            />

            <Modal
                isModalOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setDetailsId(null);
                    setInitialTab("details");
                }}
                width={1100}
                title={"Ticket details"}>
                <TicketModalForm
                    detailsId={detailsId}
                    initialTab={initialTab}
                    closeModal={() => {
                        setIsModalOpen(false);
                        refetch();
                        setDetailsId(null);
                        setInitialTab("details");
                    }}
                />
            </Modal>
        </UiContainer>
    );
};

export default TicketTable;
