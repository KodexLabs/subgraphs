/* eslint-disable no-eq-null */
import { BigInt, ByteArray, Bytes, crypto, log } from '@graphprotocol/graph-ts';
import {
	NameRegistered as NameRegisteredEvent,
	NameRenewed as NameRenewedEvent,
	Transfer as TransferEvent
} from '../../generated/BaseRegistrar/BaseRegistrar';
import {
	NameRegistered as ControllerNameRegisteredEvent,
	NameRenewed as ControllerNameRenewedEvent
} from '../../generated/EthRegistrarController/EthRegistrarController';
import { Account, Domain, NameRegistered, NameRenewed, NameTransferred, Registration } from '../../generated/schema';
import { NAME_BY_HASH_DEFAULT, REGISTRATION_DOMAIN_ROOT_NONE, REGISTRATION_KODEX_SUFFIX_CORE } from '../constants';
import { concat, createEventID, uint256ToByteArray } from '../utils';

export function handleNameRegistered(event: NameRegisteredEvent): void {
	const account = new Account(event.params.owner.toHex());
	account.save();

	const label = uint256ToByteArray(event.params.id);
	const registration = new Registration(label.toHex());
	registration.domain = crypto.keccak256(concat(REGISTRATION_DOMAIN_ROOT_NONE, label)).toHex();
	registration.registrationDate = event.block.timestamp;
	registration.expiryDate = event.params.expires;
	registration.registrant = account.id;

	registration.kodex = changetype<boolean>(
		event.transaction.input
			.toHexString()
			.toLowerCase()
			// TODO: There is most likely a better way to check for this.
			.includes(REGISTRATION_KODEX_SUFFIX_CORE)
	);

	// const labelName = ens.nameByHash(label.toHexString());
	const labelName = NAME_BY_HASH_DEFAULT;
	if (labelName !== null) {
		registration.labelName = labelName;
	}
	registration.save();

	const registrationEvent = new NameRegistered(createEventID(event));
	registrationEvent.registration = registration.id;
	registrationEvent.blockNumber = event.block.number.toI32();
	registrationEvent.transactionID = event.transaction.hash;
	registrationEvent.registrant = account.id;
	registrationEvent.expiryDate = event.params.expires;
	registrationEvent.save();
}

export function handleNameRegisteredByController(event: ControllerNameRegisteredEvent): void {
	setNamePreimage(event.params.name, event.params.label, event.params.cost);
}

export function handleNameRenewedByController(event: ControllerNameRenewedEvent): void {
	setNamePreimage(event.params.name, event.params.label, event.params.cost);
}

function setNamePreimage(name: string, label: Bytes, cost: BigInt): void {
	const labelHash = crypto.keccak256(ByteArray.fromUTF8(name));
	if (!labelHash.equals(label)) {
		log.warning("Expected '{}' to hash to {}, but got {} instead. Skipping.", [name, labelHash.toHex(), label.toHex()]);
		return;
	}

	if (name.indexOf('.') !== -1) {
		log.warning("Invalid label '{}'. Skipping.", [name]);
		return;
	}

	const domain = Domain.load(crypto.keccak256(concat(REGISTRATION_DOMAIN_ROOT_NONE, label)).toHex())!;
	if (domain.labelName !== name) {
		domain.labelName = name;
		domain.name = `${name}.eth`;
		domain.save();
	}

	const registration = Registration.load(label.toHex());
	if (registration == null) return;
	registration.labelName = name;
	registration.cost = cost;
	registration.save();
}

export function handleNameRenewed(event: NameRenewedEvent): void {
	const label = uint256ToByteArray(event.params.id);
	const registration = Registration.load(label.toHex())!;
	registration.expiryDate = event.params.expires;
	registration.save();

	const registrationEvent = new NameRenewed(createEventID(event));
	registrationEvent.registration = registration.id;
	registrationEvent.blockNumber = event.block.number.toI32();
	registrationEvent.transactionID = event.transaction.hash;
	registrationEvent.expiryDate = event.params.expires;
	registrationEvent.save();
}

export function handleNameTransferred(event: TransferEvent): void {
	const account = new Account(event.params.to.toHex());
	account.save();

	const label = uint256ToByteArray(event.params.tokenId);
	const registration = Registration.load(label.toHex());
	if (registration == null) return;

	registration.registrant = account.id;
	registration.save();

	const transferEvent = new NameTransferred(createEventID(event));
	transferEvent.registration = label.toHex();
	transferEvent.blockNumber = event.block.number.toI32();
	transferEvent.transactionID = event.transaction.hash;
	transferEvent.newOwner = account.id;
	transferEvent.save();
}
