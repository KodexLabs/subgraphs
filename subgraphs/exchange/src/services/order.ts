import { BigInt } from '@graphprotocol/graph-ts';
import { Account, Listing, Offer } from '../../generated/schema';

export function getOrCreateListing(domain: BigInt): Listing {
	const orderId = domain.toHexString();

	let listing = Listing.load(orderId);

	if (!listing) {
		listing = new Listing(orderId);
	}

	listing.domain = domain;
	listing.save();

	return listing;
}

export function getOrCreateOffer(domain: BigInt, offerer: Account): Offer {
	const orderId = `${domain.toHexString()}-${offerer.id}`;

	let offer = Offer.load(orderId);

	if (!offer) {
		offer = new Offer(orderId);
	}

	offer.domain = domain;
	offer.actor = offerer.id;
	offer.save();

	return offer;
}
