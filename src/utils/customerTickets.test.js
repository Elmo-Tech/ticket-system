import assert from "node:assert/strict";
import test from "node:test";

import { CUSTOMER_SESSION_KEY, getCustomerTicketErrorMessage, isCustomerTokenError, persistCustomerSession, readCustomerSession } from "./customerTickets.js";

const createStorage = () => {
    const values = new Map();
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
    };
};

test("customer session survives reload and is removed at expiration or logout", () => {
    const storage = createStorage();
    const session = { token: "customer-token", ticketToken: "creation-token", expiresAt: 2000 };
    persistCustomerSession(storage, session);
    assert.deepEqual(readCustomerSession(storage, 1999), session);
    assert.equal(readCustomerSession(storage, 2000), null);
    assert.equal(storage.getItem(CUSTOMER_SESSION_KEY), null);
    persistCustomerSession(storage, session);
    persistCustomerSession(storage, null);
    assert.equal(readCustomerSession(storage, 1000), null);
});

test("corrupt, incomplete and unavailable session storage does not allow access or crash", () => {
    const storage = createStorage();
    storage.setItem(CUSTOMER_SESSION_KEY, "invalid-json");
    assert.equal(readCustomerSession(storage), null);
    storage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ ticketToken: "create-only", expiresAt: 9999999999999 }));
    assert.equal(readCustomerSession(storage), null);
    assert.equal(storage.getItem(CUSTOMER_SESSION_KEY), null);
    assert.equal(readCustomerSession(null), null);
    assert.doesNotThrow(() => persistCustomerSession(null, { token: "test" }));
});

test("only a 422 dashboard token validation failure expires the customer session", () => {
    const error = (status, errors) => ({ response: { status, data: { errors } } });
    assert.equal(isCustomerTokenError(error(422, { token: ["Expired"] })), true);
    assert.equal(isCustomerTokenError(error(422, { ticketId: ["Invalid"] })), false);
    assert.equal(isCustomerTokenError(error(429, { token: ["Wait"] })), false);
    assert.equal(isCustomerTokenError(error(404)), false);
});

test("customer errors distinguish unavailable tickets, rate limiting and validation", () => {
    assert.match(getCustomerTicketErrorMessage({ response: { status: 429 } }), /Attendi/);
    assert.match(getCustomerTicketErrorMessage({ response: { status: 404 } }), /non è disponibile/);
    assert.equal(getCustomerTicketErrorMessage({ response: { status: 422, data: { errors: { ticketId: ["Invalid ticket"] } } } }), "Invalid ticket");
    assert.equal(getCustomerTicketErrorMessage({ response: { data: { message: "Server error" } } }), "Server error");
});
