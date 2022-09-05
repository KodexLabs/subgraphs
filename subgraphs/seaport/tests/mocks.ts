import { Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as";
import { OrderValidated as OrderValidatedEvent } from "../generated/Seaport/Seaport";

export function createOrderValidatedEvent(
    validator: Address,
    orderHash: Bytes,
    offerer: Address,
    zone: Address
): OrderValidatedEvent {
    const mockEvent = newMockEvent();
    const event = new OrderValidatedEvent(
        validator,
        mockEvent.logIndex,
        mockEvent.transactionLogIndex,
        mockEvent.logType,
        mockEvent.block,
        mockEvent.transaction,
        mockEvent.parameters,
        mockEvent.receipt
    );
    event.parameters = new Array();

    const orderHashParam = new ethereum.EventParam(
        "orderHash",
        ethereum.Value.fromBytes(orderHash)
    );
    const offererParam = new ethereum.EventParam(
        "offerer",
        ethereum.Value.fromAddress(offerer)
    );
    const zoneParam = new ethereum.EventParam(
        "zone",
        ethereum.Value.fromAddress(zone)
    );
    event.parameters.push(orderHashParam);
    event.parameters.push(offererParam);
    event.parameters.push(zoneParam);

    return event;
}
