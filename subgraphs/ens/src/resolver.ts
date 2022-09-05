import { Address, Bytes, ethereum } from '@graphprotocol/graph-ts';
import {
	ABIChanged as ABIChangedEvent,
	AddrChanged as AddrChangedEvent,
	AddressChanged as AddressChangedEvent,
	AuthorisationChanged as AuthorisationChangedEvent,
	ContenthashChanged as ContenthashChangedEvent,
	InterfaceChanged as InterfaceChangedEvent,
	NameChanged as NameChangedEvent,
	PubkeyChanged as PubkeyChangedEvent,
	Resolver as ResolverContract,
	TextChanged as TextChangedEvent
} from '../generated/Resolver/Resolver';
import {
	AbiChanged,
	Account,
	AddrChanged,
	AuthorisationChanged,
	ContenthashChanged,
	Domain,
	InterfaceChanged,
	MulticoinAddrChanged,
	NameChanged,
	PubkeyChanged,
	Resolver,
	TextChanged
} from '../generated/schema';

export function handleAddrChanged(event: AddrChangedEvent): void {
	const account = new Account(event.params.a.toHexString());
	account.save();

	const resolver = new Resolver(createResolverID(event.params.node, event.address));
	resolver.domain = event.params.node.toHexString();
	resolver.address = event.address;
	resolver.addr = event.params.a.toHexString();
	resolver.save();

	const domain = Domain.load(event.params.node.toHexString());
	if (domain && domain.resolver == resolver.id) {
		domain.resolvedAddress = event.params.a.toHexString();
		domain.save();
	}

	const resolverEvent = new AddrChanged(createEventID(event));
	resolverEvent.resolver = resolver.id;
	resolverEvent.blockNumber = event.block.number.toI32();
	resolverEvent.transactionID = event.transaction.hash;
	resolverEvent.addr = event.params.a.toHexString();
	resolverEvent.save();
}

export function handleMulticoinAddrChanged(event: AddressChangedEvent): void {
	const resolver = getOrCreateResolver(event.params.node, event.address);

	const coinType = event.params.coinType;
	if (resolver.coinTypes === null) {
		resolver.coinTypes = [coinType];
		resolver.save();
	} else {
		const coinTypes = resolver.coinTypes!;
		if (!coinTypes.includes(coinType)) {
			coinTypes.push(coinType);
			resolver.coinTypes = coinTypes;
			resolver.save();
		}
	}

	const resolverEvent = new MulticoinAddrChanged(createEventID(event));
	resolverEvent.resolver = resolver.id;
	resolverEvent.blockNumber = event.block.number.toI32();
	resolverEvent.transactionID = event.transaction.hash;
	resolverEvent.coinType = coinType;
	resolverEvent.addr = event.params.newAddress;
	resolverEvent.save();
}

export function handleNameChanged(event: NameChangedEvent): void {
	if (event.params.name.indexOf('\u0000') != -1) return;

	const resolverEvent = new NameChanged(createEventID(event));
	resolverEvent.resolver = createResolverID(event.params.node, event.address);
	resolverEvent.blockNumber = event.block.number.toI32();
	resolverEvent.transactionID = event.transaction.hash;
	resolverEvent.name = event.params.name;
	resolverEvent.save();
}

export function handleABIChanged(event: ABIChangedEvent): void {
	const resolverEvent = new AbiChanged(createEventID(event));
	resolverEvent.resolver = createResolverID(event.params.node, event.address);
	resolverEvent.blockNumber = event.block.number.toI32();
	resolverEvent.transactionID = event.transaction.hash;
	resolverEvent.contentType = event.params.contentType;
	resolverEvent.save();
}

export function handlePubkeyChanged(event: PubkeyChangedEvent): void {
	const resolverEvent = new PubkeyChanged(createEventID(event));
	resolverEvent.resolver = createResolverID(event.params.node, event.address);
	resolverEvent.blockNumber = event.block.number.toI32();
	resolverEvent.transactionID = event.transaction.hash;
	resolverEvent.x = event.params.x;
	resolverEvent.y = event.params.y;
	resolverEvent.save();
}

export function handleTextChanged(event: TextChangedEvent): void {
	const resolver = getOrCreateResolver(event.params.node, event.address);
	const contract = ResolverContract.bind(event.address);
	const value = contract.try_text(event.params.node, event.params.key);

	const key = event.params.key;
	if (resolver.texts === null) {
		resolver.texts = [key];
		resolver.save();
	} else {
		const texts = resolver.texts!;
		if (!texts.includes(key)) {
			texts.push(key);
			resolver.texts = texts;
			resolver.save();
		}
	}

	const resolverEvent = new TextChanged(createEventID(event));
	resolverEvent.resolver = createResolverID(event.params.node, event.address);
	resolverEvent.blockNumber = event.block.number.toI32();
	resolverEvent.transactionID = event.transaction.hash;
	resolverEvent.key = event.params.key;
	resolverEvent.value = value.value;
	resolverEvent.save();
}

export function handleContentHashChanged(event: ContenthashChangedEvent): void {
	const resolver = getOrCreateResolver(event.params.node, event.address);
	resolver.contentHash = event.params.hash;
	resolver.save();

	const resolverEvent = new ContenthashChanged(createEventID(event));
	resolverEvent.resolver = createResolverID(event.params.node, event.address);
	resolverEvent.blockNumber = event.block.number.toI32();
	resolverEvent.transactionID = event.transaction.hash;
	resolverEvent.hash = event.params.hash;
	resolverEvent.save();
}

export function handleInterfaceChanged(event: InterfaceChangedEvent): void {
	const resolverEvent = new InterfaceChanged(createEventID(event));
	resolverEvent.resolver = createResolverID(event.params.node, event.address);
	resolverEvent.blockNumber = event.block.number.toI32();
	resolverEvent.transactionID = event.transaction.hash;
	resolverEvent.interfaceID = event.params.interfaceID;
	resolverEvent.implementer = event.params.implementer;
	resolverEvent.save();
}

export function handleAuthorisationChanged(event: AuthorisationChangedEvent): void {
	const resolverEvent = new AuthorisationChanged(createEventID(event));
	resolverEvent.blockNumber = event.block.number.toI32();
	resolverEvent.transactionID = event.transaction.hash;
	resolverEvent.resolver = createResolverID(event.params.node, event.address);
	resolverEvent.owner = event.params.owner;
	resolverEvent.target = event.params.target;
	resolverEvent.isAuthorized = event.params.isAuthorised;
	resolverEvent.save();
}

function getOrCreateResolver(node: Bytes, address: Address): Resolver {
	const id = createResolverID(node, address);
	let resolver = Resolver.load(id);
	if (resolver === null) {
		resolver = new Resolver(id);
		resolver.domain = node.toHexString();
		resolver.address = address;
	}
	return resolver as Resolver;
}

function createEventID(event: ethereum.Event): string {
	return event.block.number.toString().concat('-').concat(event.logIndex.toString());
}

function createResolverID(node: Bytes, resolver: Address): string {
	return resolver.toHexString().concat('-').concat(node.toHexString());
}
