import { assert, test, logStore } from "matchstick-as/assembly/index";
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { createOrderValidatedEvent } from "./mocks";
import { handleOrderValidated } from "../src/mapping";

test("NewOrder contains all data from a OrderValidated event", () => {
    const alice = Address.fromString(
        "0x00000000000000000000000000000000000a71ce"
    );
    const bob = Address.fromString(
        "0x0000000000000000000000000000000000000b0b"
    );

    const seaportPausableZone = Address.fromString(
        "0x004C00500000aD104D7DBd00e3ae0A5C00560C00"
    );

    const orderHash = Bytes.fromHexString(
        "0x000ee3e4ef4086422253e8f605896fad9057172bf0f0a982ce053c0c8fdef590"
    );

    const orderValidatedEvent = createOrderValidatedEvent(
        alice,
        orderHash,
        bob,
        seaportPausableZone
    );

    handleOrderValidated(orderValidatedEvent);

    const newOrderId = orderHash.toHex();
    assert.fieldEquals("NewOrder", newOrderId, "id", orderHash.toHex());
    assert.fieldEquals("NewOrder", newOrderId, "transactionHash", orderValidatedEvent.transaction.hash.toHex());
    assert.fieldEquals("NewOrder", newOrderId, "transactionFromAddress", orderValidatedEvent.transaction.from.toHex());
    assert.fieldEquals("NewOrder", newOrderId, "offererAddress", bob.toHex());
    assert.fieldEquals("NewOrder", newOrderId, "zoneAddress", seaportPausableZone.toHex());
});
