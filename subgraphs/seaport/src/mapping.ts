import { Consideration, MatchedOrder, NewOrder, Offer } from '../generated/schema';
import { OrderFulfilled, OrderValidated, Seaport } from '../generated/Seaport/Seaport';

export function handleOrderFulfilled(event: OrderFulfilled): void {
	const blockTimestamp = event.block.timestamp.toI32();

	let order = MatchedOrder.load(event.params.orderHash.toHex());
	if (!order) {
		order = new MatchedOrder(event.params.orderHash.toHex());
	}

	order.transactionHash = event.transaction.hash;
	order.transactionFromAddress = event.transaction.from;
	order.timestamp = blockTimestamp;

	order.offererAddress = event.params.offerer;
	order.zoneAddress = event.params.zone;
	order.recipientAddress = event.params.recipient;
	order.save();

	const orderId = order.id;

	const offers = event.params.offer;
	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let i: i32 = 0; i < offers.length; i++) {
		const offerData = offers[i];
		const offerId = `${orderId}-${offerData.token.toHex()}-${offerData.identifier.toString()}`;

		let offer = Offer.load(offerId);
		if (!offer) {
			offer = new Offer(offerId);
		}

		offer.order = orderId;
		offer.timestamp = blockTimestamp;
		offer.itemType = offerData.itemType;
		offer.tokenAddress = offerData.token;
		offer.identifier = offerData.identifier;
		offer.amount = offerData.amount;

		offer.offererAddress = event.params.offerer;

		offer.save();
	}

	const considerations = event.params.consideration;
	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let i: i32 = 0; i < considerations.length; i++) {
		const considerationData = considerations[i];
		const onsiderationId = `${orderId}-${considerationData.token.toHex()}-${considerationData.identifier.toString()}`;

		let consideration = Consideration.load(onsiderationId);
		if (!consideration) {
			consideration = new Consideration(onsiderationId);
		}

		consideration.order = orderId;
		consideration.timestamp = blockTimestamp;
		consideration.itemType = considerationData.itemType;
		consideration.tokenAddress = considerationData.token;
		consideration.identifier = considerationData.identifier;
		consideration.amount = considerationData.amount;
		consideration.recipientAddress = considerationData.recipient;

		consideration.offererAddress = event.params.offerer;

		consideration.save();
	}
}

export function handleOrderValidated(event: OrderValidated): void {
	const seaport = Seaport.bind(event.address);

	let order = NewOrder.load(event.params.orderHash.toHex());
	if (!order) {
		order = new NewOrder(event.params.orderHash.toHex());
	}

	order.transactionHash = event.transaction.hash;
	order.transactionFromAddress = event.transaction.from;
	order.offererAddress = event.params.offerer;
	order.zoneAddress = event.params.zone;
	order.address = seaport._address;
	order.name = seaport._name;

	order.save();
}
