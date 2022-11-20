import { store } from '@graphprotocol/graph-ts';
import {
	NameListingCreated as NameListingCreatedEvent,
	NameListingRemoved as NameListingRemovedEvent,
	NameOfferCreated as NameOfferCreatedEvent,
	NameOfferRemoved as NameOfferRemovedEvent
} from '../../generated/KodexExchange/KodexExchange';
import { getOrCreateAccount } from '../services/account';
import { getOrCreateListing, getOrCreateOffer } from '../services/order';

export function handleNameListingCreated(event: NameListingCreatedEvent): void {
	const actor = getOrCreateAccount(event.params.owner);
	const listing = getOrCreateListing(event.params.tokenId);

	listing.duration = event.params.duration;
	listing.amount = event.params.askPrice;
	listing.actor = actor.id;
	listing.owner = actor.id;

	listing.save();
	actor.save();
}

export function handleNameListingRemoved(event: NameListingRemovedEvent): void {
	const actor = getOrCreateAccount(event.params.owner);
	const listing = getOrCreateListing(event.params.tokenId);

	store.remove('Listing', listing.id);

	actor.save();
}

export function handleNameOfferCreated(event: NameOfferCreatedEvent): void {
	const actor = getOrCreateAccount(event.params.offerer);
	const owner = getOrCreateAccount(event.params.owner);
	const offer = getOrCreateOffer(event.params.tokenId, actor);

	offer.duration = event.params.duration;
	offer.amount = event.params.offerAmount;
	offer.owner = owner.id;

	offer.save();
	actor.save();
}

export function handleNameOfferRemoved(event: NameOfferRemovedEvent): void {
	const actor = getOrCreateAccount(event.params.offerer);
	const offer = getOrCreateOffer(event.params.tokenId, actor);

	store.remove('Offer', offer.id);

	actor.save();
}
