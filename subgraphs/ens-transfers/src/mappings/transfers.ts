import { events, transactions } from '@amxx/graphprotocol-utils';
import { Address } from '@graphprotocol/graph-ts';
import { Approval as ApprovalEvent, ApprovalForAll as ApprovalForAllEvent, Transfer as TransferEvent } from '../../generated/BaseRegistrar/IERC721';
import { ERC721Transfer } from '../../generated/schema';
import { fetchAccount } from '../services/account';
import { fetchERC721, fetchERC721Operator, fetchERC721Token } from '../services/erc721';

export function handleTransfer(event: TransferEvent): void {
	const contract = fetchERC721(event.address);
	if (contract !== null) {
		const token = fetchERC721Token(contract, event.params.tokenId);
		const from = fetchAccount(event.params.from);
		const to = fetchAccount(event.params.to);

		token.owner = to.id;
		token.approval = fetchAccount(Address.zero()).id; // implicit approval reset on transfer

		contract.save();
		token.save();

		const ev = new ERC721Transfer(events.id(event));
		ev.emitter = contract.id;
		ev.transaction = transactions.log(event).id;
		ev.timestamp = event.block.timestamp;
		ev.contract = contract.id;
		ev.token = token.id;
		ev.from = from.id;
		ev.to = to.id;
		ev.save();
	}
}

export function handleApproval(event: ApprovalEvent): void {
	const contract = fetchERC721(event.address);
	if (contract !== null) {
		const token = fetchERC721Token(contract, event.params.tokenId);
		const owner = fetchAccount(event.params.owner);
		const approved = fetchAccount(event.params.approved);

		token.owner = owner.id;
		token.approval = approved.id;

		token.save();
		owner.save();
		approved.save();
	}
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
	const contract = fetchERC721(event.address);
	if (contract !== null) {
		const owner = fetchAccount(event.params.owner);
		const operator = fetchAccount(event.params.operator);
		const delegation = fetchERC721Operator(contract, owner, operator);

		delegation.approved = event.params.approved;

		delegation.save();
	}
}
