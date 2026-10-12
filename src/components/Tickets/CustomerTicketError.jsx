import { Alert, Button } from "antd";
import { getCustomerTicketErrorMessage } from "../../utils/customerTickets";

const CustomerTicketError = ({ error, onRetry }) => (
    <Alert
        type="error"
        showIcon
        message={getCustomerTicketErrorMessage(error)}
        action={<Button onClick={onRetry}>Riprova</Button>}
    />
);

export default CustomerTicketError;
